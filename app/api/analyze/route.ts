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
    .select('tipo_local, m2, colonia, descripcion, modalidad, competition_data, precio_inmueble')
    .eq('id', propertyId)
    .single();

  if (error || !property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const competitionSummary = property.competition_data
    ? Object.entries(property.competition_data.within_500m as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, count]) => `${cat}: ${count}`)
        .join(', ')
    : 'No competition data available';

  const prompt = `You are a commercial real estate consultant with global city market expertise.
Analyze the following property and provide concrete business recommendations in English.

PROPERTY DATA:
- Type: ${property.tipo_local}
- Neighborhood: ${property.colonia}
- Size: ${property.m2} m²
- Listing type: ${property.modalidad === 'rent' ? 'For rent' : property.modalidad === 'sale' ? 'For sale' : 'Not specified'}
- Price: ${property.precio_inmueble ? `$${property.precio_inmueble.toLocaleString('en-US')} MXN` : 'Not specified'}
${property.descripcion ? `- Description: ${property.descripcion}` : ''}

NEARBY COMPETITION (500m):
${competitionSummary}

Respond in JSON format with this exact structure:
{
  "nivel_competencia": "low | medium | high",
  "oportunidad": "One sentence about the market opportunity in this area",
  "usos_recomendados": [
    { "uso": "Business name", "razon": "Why it works in this area" },
    { "uso": "Business name", "razon": "Why it works in this area" },
    { "uso": "Business name", "razon": "Why it works in this area" }
  ],
  "advertencia": "Main risk or important consideration (or null if none)"
}`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
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

  let analysis;
  try {
    analysis = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from AI response' }, { status: 500 });
  }

  return NextResponse.json({ analysis });
}
