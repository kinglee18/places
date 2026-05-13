import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface AiResult {
  giro_detectado: string;
  resumen_interpretacion: string;
  requisitos_espacio: {
    m2_minimo: number;
    m2_ideal: number;
    servicios_necesarios: string[];
    caracteristicas_deseables: string[];
  };
  colonias_recomendadas: { nombre: string; razon: string; nivel_competencia: string; nivel_oportunidad: number }[];
  presupuesto_viable: boolean;
  mensaje_presupuesto: string;
  alertas: string[];
  consejos: string[];
}

interface RawProperty {
  id: string;
  colonia: string;
  calle: string | null;
  numero: string | null;
  tipo_local: string;
  m2: number;
  agua_drenaje: string | null;
  modalidad: string | null;
  precio_inmueble: number | null;
  precio_mantenimiento: number | null;
  descripcion: string | null;
  photo_urls: string[];
  nivel_piso: string | null;
  banos: number;
  estacionamientos: number;
  lat: number | null;
  lng: number | null;
}

const MAX_RADIUS_KM = 2;

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    descripcion,
    zona,
    lat,
    lng,
    presupuesto,
    disponibilidad,
    modalidad,
    giro_pre_detectado,
    preflight_property_ids,
  } = body as {
    descripcion?: string;
    zona?: string | null;
    lat?: number | null;
    lng?: number | null;
    presupuesto?: number | null;
    disponibilidad?: string[];
    modalidad?: 'rent' | 'sale' | 'any' | null;
    giro_pre_detectado?: string | null;
    preflight_property_ids?: string[];
  };

  if (!descripcion || descripcion.trim().length < 10) {
    return NextResponse.json({ error: 'Description too short.' }, { status: 400 });
  }

  // ── 1. AI analysis ──────────────────────────────────────────────────────────
  const giroAnchor = giro_pre_detectado
    ? `\nBusiness category already identified in the previous step: "${giro_pre_detectado}". Use it as a base; only suggest a different one if the description clearly contradicts it.`
    : '';

  const modalidadHint = modalidad && modalidad !== 'any'
    ? `\nThe entrepreneur is specifically looking for: ${modalidad === 'rent' ? 'RENT' : 'BUY'}. Factor this into your advice.`
    : '';

  const prompt = `You are a commercial real estate market expert with global city knowledge.
An entrepreneur describes their situation:

"${descripcion}"

${zona ? `Preferred zone / city: ${zona}` : ''}
${lat && lng ? `GPS coordinates selected on the map: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : ''}
${presupuesto ? `Monthly rent budget: $${presupuesto} MXN` : ''}
${disponibilidad && disponibilidad.length > 0 ? `Availability: ${(disponibilidad as string[]).join(', ')}` : ''}${giroAnchor}${modalidadHint}

Analyze the situation and extract:
1. The implicit business category
2. Physical space requirements (m², utilities, features)
3. The 3 best neighborhoods for that category (based on the preferred city if provided, otherwise CDMX), with reason and opportunity level
4. Whether the budget is viable for those areas (if provided)
5. Important alerts and practical tips

Respond ONLY with valid JSON without markdown, using this exact structure:
{
  "giro_detectado": "string",
  "resumen_interpretacion": "1-2 sentence string describing what you understood",
  "requisitos_espacio": {
    "m2_minimo": number,
    "m2_ideal": number,
    "servicios_necesarios": ["string"],
    "caracteristicas_deseables": ["string"]
  },
  "colonias_recomendadas": [
    {
      "nombre": "string",
      "razon": "string",
      "nivel_competencia": "low|medium|high",
      "nivel_oportunidad": number
    }
  ],
  "presupuesto_viable": boolean,
  "mensaje_presupuesto": "string",
  "alertas": ["string"],
  "consejos": ["string"]
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'No se pudo generar el análisis' }, { status: 500 });
  }

  const aiResult: AiResult = JSON.parse(jsonMatch[0]);

  // ── 2. Fetch properties ──────────────────────────────────────────────────
  // Si el preflight ya nos pasó IDs, usamos esos directamente. Si no, traemos
  // todos los publicados (con filtro de modalidad si aplica).
  let propsQuery = supabase
    .from('properties')
    .select('id, colonia, calle, numero, tipo_local, m2, agua_drenaje, modalidad, precio_inmueble, precio_mantenimiento, descripcion, photo_urls, nivel_piso, banos, estacionamientos, lat, lng')
    .eq('is_published', true);

  if (preflight_property_ids && preflight_property_ids.length > 0) {
    propsQuery = propsQuery.in('id', preflight_property_ids);
  } else if (modalidad === 'rent' || modalidad === 'sale') {
    propsQuery = propsQuery.eq('modalidad', modalidad);
  }

  const { data: properties } = await propsQuery;

  // ── 3. Score each property ──────────────────────────────────────────────
  const { m2_minimo, m2_ideal, servicios_necesarios } = aiResult.requisitos_espacio;
  const recommendedZones = aiResult.colonias_recomendadas.map(c => c.nombre.toLowerCase().trim());
  const needsWater = servicios_necesarios.some(s => /agua|water|drenaje|drain/i.test(s));
  const needsGas = servicios_necesarios.some(s => /gas/i.test(s));
  const presupuestoNum = presupuesto ? Number(presupuesto) : null;
  const hasGeo = typeof lat === 'number' && typeof lng === 'number';

  const scored = (properties as RawProperty[] ?? [])
    .map(p => {
      let score = 0;
      const reasons: string[] = [];

      // ── Geo proximity (preferido sobre substring) ──
      if (hasGeo && p.lat != null && p.lng != null) {
        const d = distanceKm(lat as number, lng as number, p.lat, p.lng);
        if (d <= 0.5) { score += 50; reasons.push(`${(d * 1000).toFixed(0)}m from the area`); }
        else if (d <= 1) { score += 40; reasons.push(`${d.toFixed(2)}km from the area`); }
        else if (d <= MAX_RADIUS_KM) { score += 25; reasons.push(`${d.toFixed(1)}km from the area`); }
        else if (d <= 5) { score += 10; reasons.push(`${d.toFixed(1)}km — a bit far`); }
      } else {
        // Fallback: zone-name match (legacy behavior)
        const zoneIdx = recommendedZones.findIndex(z =>
          p.colonia.toLowerCase().includes(z) || z.includes(p.colonia.toLowerCase())
        );
        if (zoneIdx === 0) { score += 50; reasons.push(`Top recommended zone: ${p.colonia}`); }
        else if (zoneIdx === 1) { score += 35; reasons.push(`Recommended zone: ${p.colonia}`); }
        else if (zoneIdx === 2) { score += 20; reasons.push(`Compatible zone: ${p.colonia}`); }
      }

      // ── m² compatibility ──
      const m2Max = m2_ideal * 1.8;
      const m2FlexMin = m2_minimo * 0.7;
      if (p.m2 >= m2_minimo && p.m2 <= m2_ideal) {
        score += 30;
        reasons.push(`${p.m2} m² — ideal size`);
      } else if (p.m2 >= m2FlexMin && p.m2 <= m2Max) {
        score += 15;
        reasons.push(`${p.m2} m² — acceptable size`);
      } else {
        return { ...p, match_score: 0, match_reasons: [] };
      }

      // ── Water/drainage ──
      if (needsWater && p.agua_drenaje && /agua|water/i.test(p.agua_drenaje)) {
        score += 20;
        reasons.push('Water and drainage available');
      }

      // ── Gas ──
      if (needsGas && p.descripcion && /gas/i.test(p.descripcion)) {
        score += 10;
        reasons.push('Gas connection');
      }

      // ── Budget fit ──
      if (presupuestoNum && p.precio_inmueble) {
        if (p.precio_inmueble <= presupuestoNum) {
          score += 15;
          reasons.push('Within your budget');
        } else if (p.precio_inmueble <= presupuestoNum * 1.2) {
          score += 5;
          reasons.push('Slightly above budget');
        }
      }

      if (p.modalidad === 'rent') reasons.push('For rent');
      else if (p.modalidad === 'sale') reasons.push('For sale');

      return { ...p, match_score: score, match_reasons: reasons };
    })
    .filter(p => p.match_score >= 20)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 6);

  return NextResponse.json({ ...aiResult, matching_properties: scored });
}
