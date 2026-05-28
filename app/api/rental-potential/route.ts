import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId } = await req.json();
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }

  const { data: property, error } = await getSupabase()
    .from('properties')
    .select('tipo_local, m2, colonia, city, state, modalidad, precio_inmueble, nivel_piso, estado_conservacion, calidad_construccion, estacionamientos, competition_data')
    .eq('id', propertyId)
    .single();

  if (error || !property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const location = [property.colonia, property.city ?? 'CDMX', property.state ?? 'Mexico']
    .filter(Boolean)
    .join(', ');

  const competitionCtx = property.competition_data
    ? (() => {
        const cd = property.competition_data as {
          within_500m?: Record<string, number>;
          opportunities?: { category: string; score: string }[];
          saturated?: { category: string }[];
          tourist_context?: { zone_type: string } | null;
        };
        const parts: string[] = [];
        if (cd.within_500m) {
          const top = Object.entries(cd.within_500m)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([cat, n]) => `${cat}(${n})`)
            .join(', ');
          parts.push(`Nearby businesses: ${top}`);
        }
        if (cd.opportunities?.length) {
          parts.push(`Opportunities: ${cd.opportunities.map(o => o.category).join(', ')}`);
        }
        if (cd.saturated?.length) {
          parts.push(`Saturated: ${cd.saturated.map(s => s.category).join(', ')}`);
        }
        if (cd.tourist_context) {
          parts.push(`Zone type: ${cd.tourist_context.zone_type}`);
        }
        return parts.join(' | ') || 'No zone data';
      })()
    : 'No zone data available';

  // ── Size tier classification ────────────────────────────────────────────────
  const m2 = property.m2;
  const sizeTier =
    m2 < 15  ? 'Micro (<15 m²): price/m² is typically higher due to scarcity, but absolute rent stays low' :
    m2 < 40  ? 'Small (15–40 m²): standard market rate per m² applies' :
    m2 < 100 ? 'Medium (40–100 m²): slight discount per m² vs. smaller units is normal' :
               'Large (>100 m²): per-m² rate is lower; absolute rent is a large number';

  const prompt = `You are helping a property OWNER set a competitive listing price for their commercial space in Mexico.
Your goal is to suggest a realistic asking price they can advertise — not a theoretical maximum.
Be conservative: it is better to give a slightly lower range and let the owner adjust up than to inflate numbers that won't match real demand.

REFERENCE MARKET RATES (commercial rent per m²/month, CDMX 2024 — use as anchor):
- Premium zones (Polanco, Santa Fe, Paseo de la Reforma): $250–$600 MXN/m²
- High-demand zones (Roma, Condesa, Nápoles, Del Valle, Coyoacán): $180–$350 MXN/m²
- Mid-market zones (Guerrero, Doctores, Obrera, Portales, Tepepan): $80–$180 MXN/m²
- Popular/working-class zones (Tepito, Merced area, Iztapalapa, Xochimilco): $40–$100 MXN/m²
Note: these are CDMX rates. For other states (Guerrero state, Oaxaca, Michoacán, etc.) rates are generally 30–50% lower than CDMX mid-market.

SIZE TIER FOR THIS PROPERTY:
${sizeTier}

PROPERTY:
- Location: ${location}
- Type: ${property.tipo_local}
- Size: ${m2} m²
- Floor: ${property.nivel_piso ?? 'Not specified'}
- Condition: ${property.estado_conservacion ?? 'Not specified'}
- Build quality: ${property.calidad_construccion ?? 'Not specified'}
- Parking spaces: ${property.estacionamientos ?? 0}
${property.precio_inmueble ? `- Owner's current listed price: $${property.precio_inmueble.toLocaleString('en-US')} MXN` : ''}

ZONE CONTEXT:
${competitionCtx}

TASK: Suggest a competitive monthly rental asking price (min–max range) for this space.
- Anchor to the reference rates above using the neighborhood tier
- Apply the size tier adjustment
- Cross-check: if the listed price already exists, make sure your range is in the same ballpark or explain the gap in the summary
- The range should be narrow (20–30% spread), not a huge uncertainty band

Respond ONLY in JSON with this exact structure:
{
  "estimated_min": <number in MXN/month>,
  "estimated_max": <number in MXN/month>,
  "price_per_m2": <number in MXN/m2/month — use midpoint>,
  "confidence": "high" | "medium" | "low",
  "summary": "<2 sentences: (1) how you estimated it and the key price driver, (2) one actionable suggestion for the owner>"
}

confidence guide: "high" = neighborhood is in the reference list above with clear comparable data, "medium" = nearby neighborhood or similar zone, "low" = state outside CDMX or limited comparable data.`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Anthropic API error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not generate estimate' }, { status: 500 });
  }

  let rental;
  try {
    rental = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from AI response' }, { status: 500 });
  }

  return NextResponse.json({ rental });
}
