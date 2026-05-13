import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';
import {
  detectGiroByKeywords,
  computeSaturation,
  GIRO_BY_ID,
  GIROS,
  type GiroDef,
  type SaturationCount,
} from '@/lib/giros';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  competition_data: {
    within_500m?: Record<string, number>;
    within_2km?: Record<string, number>;
  } | null;
}

export interface PropertyMatch extends Omit<RawProperty, 'competition_data'> {
  distance_km: number | null;
  saturacion: SaturationCount;
}

const MAX_RADIUS_KM = 2;

/** Haversine distance in km. */
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

/**
 * Fallback: micro-call a Haiku que SOLO devuelve {giro_id} de la lista cerrada.
 * Mantenemos el catálogo en el prompt para forzar una salida mapeable.
 */
async function detectGiroByAi(descripcion: string): Promise<GiroDef | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const catalogo = GIROS.map((g) => `- ${g.id}: ${g.label}`).join('\n');
  const prompt = `Classify the following entrepreneur description into ONE of the business categories below (respond with only the id, nothing else; if none apply respond "ninguno"):

${catalogo}

Description:
"${descripcion}"

Response (id only):`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = message.content[0].type === 'text' ? message.content[0].text.trim().toLowerCase() : '';
    const id = raw.replace(/[^a-z_]/g, '');
    return GIRO_BY_ID[id] ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { descripcion, lat, lng, modalidad, presupuesto } = body as {
    descripcion?: string;
    lat?: number | null;
    lng?: number | null;
    modalidad?: 'rent' | 'sale' | 'any' | null;
    presupuesto?: number | null;
  };

  if (!descripcion || descripcion.trim().length < 10) {
    return NextResponse.json({ error: 'Description too short.' }, { status: 400 });
  }

  // ── 1. Detección híbrida de giro ──────────────────────────────────────────
  let giro = detectGiroByKeywords(descripcion);
  let giroSource: 'keyword' | 'ai' | 'unknown' = giro ? 'keyword' : 'unknown';

  if (!giro) {
    const aiGiro = await detectGiroByAi(descripcion);
    if (aiGiro) {
      giro = aiGiro;
      giroSource = 'ai';
    }
  }

  // ── 2. Query a Supabase ──────────────────────────────────────────────────
  let query = supabase
    .from('properties')
    .select('id, colonia, calle, numero, tipo_local, m2, agua_drenaje, modalidad, precio_inmueble, precio_mantenimiento, descripcion, photo_urls, nivel_piso, banos, estacionamientos, lat, lng, competition_data')
    .eq('is_published', true);

  if (modalidad === 'rent' || modalidad === 'sale') {
    query = query.eq('modalidad', modalidad);
  }

  const { data: properties, error: dbError } = await query;
  if (dbError) {
    return NextResponse.json({ error: 'Could not load properties.' }, { status: 500 });
  }

  const all = (properties as RawProperty[]) ?? [];
  const hasGeo = typeof lat === 'number' && typeof lng === 'number';

  // ── 3. Filtro geográfico + saturación ────────────────────────────────────
  const matches: PropertyMatch[] = all
    .map((p) => {
      const distance =
        hasGeo && p.lat != null && p.lng != null
          ? distanceKm(lat as number, lng as number, p.lat, p.lng)
          : null;

      const saturacion = giro
        ? computeSaturation(giro, p.competition_data)
        : { competidores_500m: 0, competidores_2km: 0, nivel: 'low' as const };

      const { competition_data: _omit, ...rest } = p;
      void _omit;
      return { ...rest, distance_km: distance, saturacion };
    })
    .filter((p) => {
      if (!hasGeo) return true;                   // sin geo input, no filtramos por distancia
      if (p.distance_km == null) return false;    // si la prop no tiene lat/lng la dejamos fuera
      return p.distance_km <= MAX_RADIUS_KM;
    })
    .sort((a, b) => {
      // ordena por distancia asc; si ambos null mantén el orden original
      if (a.distance_km == null && b.distance_km == null) return 0;
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    })
    .slice(0, 12);

  // ── 4. Filtro suave de presupuesto: marca over budget pero no descarta ──
  // (lo deja al cliente — útil para mostrar "ligeramente arriba de tu presupuesto")
  const enriched = matches.map((p) => {
    let budget_status: 'within' | 'over' | 'unknown' = 'unknown';
    if (typeof presupuesto === 'number' && p.precio_inmueble != null) {
      budget_status = p.precio_inmueble <= presupuesto ? 'within' : 'over';
    }
    return { ...p, budget_status };
  });

  return NextResponse.json({
    giro_detectado: giro
      ? { id: giro.id, label: giro.label, emoji: giro.emoji, source: giroSource }
      : { id: null, label: 'Not identified', emoji: '❓', source: giroSource },
    modalidad_filtro: modalidad ?? 'any',
    geo_aplicado: hasGeo,
    radio_km: hasGeo ? MAX_RADIUS_KM : null,
    total_disponibles: all.length,
    properties_match: enriched,
    necesita_analisis_ia: enriched.length === 0 || !giro,
  });
}
