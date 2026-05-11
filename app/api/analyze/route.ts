import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId } = await req.json();
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId requerido' }, { status: 400 });
  }

  const { data: property, error } = await supabase
    .from('properties')
    .select('tipo_local, m2, colonia, descripcion, modalidad, competition_data, precio_inmueble')
    .eq('id', propertyId)
    .single();

  if (error || !property) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
  }

  const competitionSummary = property.competition_data
    ? Object.entries(property.competition_data.within_500m as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, count]) => `${cat}: ${count}`)
        .join(', ')
    : 'Sin datos de competencia disponibles';

  const prompt = `Eres un consultor de bienes raíces comerciales especializado en la Ciudad de México.
Analiza la siguiente propiedad y proporciona recomendaciones de negocio concretas en español.

DATOS DE LA PROPIEDAD:
- Tipo: ${property.tipo_local}
- Colonia: ${property.colonia}
- Superficie: ${property.m2} m²
- Modalidad: ${property.modalidad === 'rent' ? 'Renta' : property.modalidad === 'sale' ? 'Venta' : 'No especificada'}
- Precio: ${property.precio_inmueble ? `$${property.precio_inmueble.toLocaleString('es-MX')} MXN` : 'No especificado'}
${property.descripcion ? `- Descripción: ${property.descripcion}` : ''}

COMPETENCIA CERCANA (500m):
${competitionSummary}

Responde en formato JSON con esta estructura exacta:
{
  "nivel_competencia": "bajo | medio | alto",
  "oportunidad": "Una oración sobre la oportunidad de mercado en esta zona",
  "usos_recomendados": [
    { "uso": "Nombre del negocio", "razon": "Por qué funciona en esta zona" },
    { "uso": "Nombre del negocio", "razon": "Por qué funciona en esta zona" },
    { "uso": "Nombre del negocio", "razon": "Por qué funciona en esta zona" }
  ],
  "advertencia": "Riesgo principal o consideración importante (o null si no hay)"
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from potential markdown fences
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'No se pudo generar el análisis' }, { status: 500 });
  }

  const analysis = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ analysis });
}
