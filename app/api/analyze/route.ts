import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import { getSupabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  BUSINESS_CATEGORIES,
  GAP_LABEL_TO_CATEGORY_IDS,
  normalizeRecommendations,
} from '@/lib/businessCategories';

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId, locale } = await req.json();
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }
  const language = locale === 'es' ? 'Spanish' : 'English';

  const { data: property, error } = await getSupabase()
    .from('properties')
    .select('tipo_local, m2, colonia, city, state, descripcion, modalidad, competition_data, precio_inmueble, usos_permitidos, usos_no_preferidos')
    .eq('id', propertyId)
    .single();

  if (error || !property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const cd = property.competition_data as Record<string, unknown> | null;

  // ── 1. What already exists nearby (top 5 categories by count) ─────────────
  const categoryCounts = cd
    ? Object.entries(cd.within_500m as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, count]) => `  • ${cat}: ${count}`)
        .join('\n')
    : '  (no data)';

  // ── 2. Wider area demand signals (2–5km) ──────────────────────────────────
  const demandSignals = cd
    ? Object.entries(cd.within_2km as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([cat, count]) => `  • ${cat}: ${count}`)
        .join('\n')
    : '  (no data)';

  // ── 3. Specific business names nearby (so Claude can infer subcategories) ─
  const topNearby = cd
    ? ((cd.top_nearby ?? []) as Array<{ name: string; category: string | null }>)
        .slice(0, 8)
        .map(p => p.name)
        .filter(Boolean)
        .join(', ')
    : '';

  // ── 4. Food subcategory gaps (demand proven in wider area, absent locally) ─
  const foodGaps: string[] = cd
    ? ((cd.food_subcategories as { gaps?: string[] } | undefined)?.gaps ?? [])
    : [];

  // ── 5. High-score opportunity categories ──────────────────────────────────
  const highOpportunities: string[] = cd
    ? ((cd.opportunities ?? []) as Array<{ category: string; score: string }>)
        .filter(o => o.score === 'high')
        .map(o => o.category)
        .slice(0, 5)
    : [];

  // ── Build location string ─────────────────────────────────────────────────
  const location = [property.colonia, property.city, property.state]
    .filter(Boolean)
    .join(', ');

  const price = property.precio_inmueble
    ? `$${property.precio_inmueble.toLocaleString('en-US')} MXN`
    : 'price not specified';

  // ── Owner-declared use constraints ────────────────────────────────────────
  const usosPermitidos = (property.usos_permitidos ?? []) as string[];
  const usosNoPreferidos = (property.usos_no_preferidos ?? []) as string[];
  const ownerConstraints = usosPermitidos.length > 0 || usosNoPreferidos.length > 0
    ? `
OWNER CONSTRAINTS:${usosPermitidos.length > 0 ? `\n  Allowed uses declared by the owner: ${usosPermitidos.join(', ')}` : ''}${usosNoPreferidos.length > 0 ? `\n  Uses the owner does NOT want: ${usosNoPreferidos.join(', ')}` : ''}
Never recommend a category that conflicts with these constraints.
`
    : '';

  const taxonomyLines = BUSINESS_CATEGORIES
    .map(c => `  ${c.id} — ${c.labelEn}`)
    .join('\n');

  const gapLine = (g: string): string => {
    const ids = GAP_LABEL_TO_CATEGORY_IDS[g];
    return ids?.length ? `  • ${g} (taxonomy: ${ids.join(', ')})` : `  • ${g}`;
  };

  // ── Compose prompt ────────────────────────────────────────────────────────
  const prompt = `You are a local market analyst helping people searching for a commercial space decide what business would thrive in it. Give concrete, actionable suggestions for businesses that a single entrepreneur can realistically start.

LOCATION: ${location}
SPACE: ${property.tipo_local} · ${property.m2} m² · ${property.modalidad === 'rent' ? 'for rent' : property.modalidad === 'sale' ? 'for sale' : 'listing type unspecified'} · ${price}${property.descripcion ? `\nDESCRIPTION: ${property.descripcion}` : ''}

BUSINESS CATEGORY TAXONOMY (every recommendation MUST use an "id" copied EXACTLY from this list, nothing else):
${taxonomyLines}

NEARBY BUSINESSES (500m — what already exists):
${categoryCounts}

NEARBY BUSINESS NAMES (use to detect subcategories):
${topNearby || '  (none identified)'}

WIDER AREA BUSINESSES (2–5km — demand signals):
${demandSignals}
${foodGaps.length > 0 ? `
FOOD SUBCATEGORY GAPS — these cuisines are present 2–5km away (demand is proven in the area) but absent within 500m:
${foodGaps.map(gapLine).join('\n')}` : ''}
${highOpportunities.length > 0 ? `
LOW-COMPETITION CATEGORIES (few or no competitors within 500m):
${highOpportunities.map(o => `  • ${o}`).join('\n')}` : ''}${ownerConstraints}
RULES (strictly follow):
1. NEVER recommend banks, ATMs, insurance agencies, government offices, hospitals, or any business that requires special government licensing — these are not viable for typical entrepreneurs.
2. Food gaps are high-priority: if a cuisine type is present in the wider area but missing locally, that is proven demand with low local competition — flag it explicitly.
3. Recommend only businesses an entrepreneur can start with under $500,000 MXN in initial investment.
4. Use the city/state to reason about regional food culture, consumer habits, and local demand.
5. Every recommendation MUST carry an "id" copied exactly from the taxonomy above. The "uso" field is a short, specific display name in ${language} (e.g. id "taco" → uso "Taquería de birria"). Never invent ids and never answer with a generic "restaurant".
6. "mejor_uso" is your single strongest pick — the one business with the best demand/competition fit for this exact location. Do not repeat its id in "otros_usos".

Respond ONLY in ${language}. Respond ONLY in JSON with this exact structure:
{
  "nivel_competencia": "low | medium | high",
  "oportunidad": "One sentence describing the main market opportunity in this specific location",
  "mejor_uso": { "id": "taxonomy id", "uso": "Specific business name in ${language}", "razon": "Why this is the single best fit for this location" },
  "otros_usos": [
    { "id": "taxonomy id", "uso": "Specific business name", "razon": "Why it fits this location and what gap or demand it fills" },
    { "id": "taxonomy id", "uso": "Specific business name", "razon": "Why it fits this location and what gap or demand it fills" },
    { "id": "taxonomy id", "uso": "Specific business name", "razon": "Why it fits this location and what gap or demand it fills" }
  ],
  "advertencia": "Main risk or important consideration, or null if none"
}`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Anthropic API error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from potential markdown fences
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not generate analysis' }, { status: 500 });
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from AI response' }, { status: 500 });
  }

  // Validate recommendation ids against the closed taxonomy
  const { mejorUso, otrosUsos, bestUse, recommendedUses } = normalizeRecommendations(parsed);
  const analysis = {
    ...parsed,
    mejor_uso: mejorUso,
    otros_usos: otrosUsos,
  };

  // Persist ai_analysis into competition_data without overwriting zone data,
  // plus the searchable best_use / recommended_uses columns
  const existing = (property.competition_data ?? {}) as Record<string, unknown>;
  const { error: updateError } = await getSupabaseAdmin()
    .from('properties')
    .update({
      competition_data: { ...existing, ai_analysis: analysis },
      best_use: bestUse,
      recommended_uses: recommendedUses,
    })
    .eq('id', propertyId);
  if (updateError) {
    console.error('analyze: failed to persist analysis', updateError.message);
  }

  return NextResponse.json({ analysis, persisted: !updateError });
}
