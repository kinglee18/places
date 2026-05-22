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
    .select(
      'tipo_local, m2, colonia, city, state, modalidad, precio_inmueble, ' +
      'nivel_piso, estado_conservacion, calidad_construccion, estacionamientos, ' +
      'competition_data'
    )
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

  const prompt = `You are a commercial real estate expert specializing in Mexico City and Latin American urban markets.

Estimate the monthly rental potential for this commercial property based on its characteristics and location. Use your knowledge of market rates for Mexico City neighborhoods.

PROPERTY:
- Location: ${location}
- Type: ${property.tipo_local}
- Size: ${property.m2} m²
- Floor: ${property.nivel_piso ?? 'Not specified'}
- Condition: ${property.estado_conservacion ?? 'Not specified'}
- Build quality: ${property.calidad_construccion ?? 'Not specified'}
- Parking spaces: ${property.estacionamientos ?? 0}
${property.precio_inmueble ? `- Owner's listed price: $${property.precio_inmueble.toLocaleString('en-US')} MXN` : ''}

ZONE CONTEXT:
${competitionCtx}

Estimate a realistic monthly rental range in MXN for this commercial space. Base your estimate on:
1. Typical commercial rental rates per m² for this neighborhood
2. Property characteristics (size, condition, floor, parking)
3. Zone demand signals from competition data

Respond ONLY in JSON with this exact structure:
{
  "estimated_min": <number in MXN/month>,
  "estimated_max": <number in MXN/month>,
  "price_per_m2": <number in MXN/m2/month>,
  "confidence": "high" | "medium" | "low",
  "summary": "<1-2 sentences explaining the estimate and key factors>"
}

confidence guide: "high" = well-known neighborhood with clear market data, "medium" = some uncertainty, "low" = limited data for this area.`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
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
