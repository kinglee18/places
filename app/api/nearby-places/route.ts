import { NextRequest, NextResponse } from 'next/server';

const TYPE_TO_CATEGORY: Record<string, string> = {
  cafe: 'Café',
  bakery: 'Café / Bakery',
  coffee_shop: 'Café',
  restaurant: 'Restaurant',
  fast_food_restaurant: 'Restaurant',
  meal_takeaway: 'Restaurant',
  meal_delivery: 'Restaurant',
  bar: 'Bar',
  night_club: 'Bar',
  gym: 'Gym / Wellness',
  spa: 'Gym / Wellness',
  pharmacy: 'Pharmacy',
  drugstore: 'Pharmacy',
  supermarket: 'Convenience / Grocery',
  grocery_store: 'Convenience / Grocery',
  convenience_store: 'Convenience / Grocery',
  beauty_salon: 'Beauty / Salon',
  hair_salon: 'Beauty / Salon',
  clothing_store: 'Clothing / Retail',
  store: 'Retail',
  laundry: 'Laundry',
  dentist: 'Medical / Clinic',
  doctor: 'Medical / Clinic',
  hospital: 'Medical / Clinic',
  bank: 'Bank / Finance',
  atm: 'Bank / Finance',
};

const INCLUDED_TYPES = Object.keys(TYPE_TO_CATEGORY);

// Google Places v2 types that signal a tourist zone
const TOURIST_TYPES = [
  'tourist_attraction', 'museum', 'art_gallery', 'historical_landmark',
  'monument', 'hotel', 'lodging', 'amusement_park', 'park', 'zoo',
  'church', 'hindu_temple', 'mosque', 'synagogue', 'stadium', 'performing_arts_theater',
];

// Maps tourist Google type → display label
const TOURIST_CATEGORY_MAP: Record<string, string> = {
  tourist_attraction: 'Atracción turística',
  museum: 'Museo',
  art_gallery: 'Galería de arte',
  historical_landmark: 'Monumento histórico',
  monument: 'Monumento',
  hotel: 'Hotel',
  lodging: 'Hospedaje',
  amusement_park: 'Parque de atracciones',
  park: 'Parque',
  zoo: 'Zoológico',
  church: 'Iglesia',
  hindu_temple: 'Templo',
  mosque: 'Mezquita',
  synagogue: 'Sinagoga',
  stadium: 'Estadio',
  performing_arts_theater: 'Teatro',
};

type ZoneType = 'cultural' | 'religious' | 'entertainment' | 'nature' | 'lodging' | 'mixed';

// Business suggestions per tourist zone type
const ZONE_SUGGESTIONS: Record<ZoneType, Array<{ category: string; reason: string }>> = {
  cultural: [
    { category: 'Souvenir / Artesanías', reason: 'Los visitantes de museos y zonas históricas buscan recuerdos representativos del lugar.' },
    { category: 'Café temático', reason: 'Los turistas culturales valoran espacios para descansar y socializar entre visitas.' },
    { category: 'Tour operator', reason: 'Alta demanda de guías, recorridos y experiencias organizadas.' },
    { category: 'Fotografía / Impresión', reason: 'Los visitantes buscan imprimir o enmarcar fotos de su visita.' },
    { category: 'Librería / Arte', reason: 'Venta de libros, catálogos y reproducciones artísticas locales.' },
  ],
  religious: [
    { category: 'Artículos religiosos', reason: 'Visitantes y feligreses demandan velas, imágenes y artículos devocionales.' },
    { category: 'Café / Panadería', reason: 'Los visitantes de zonas religiosas buscan opciones de descanso cercanas.' },
    { category: 'Floristería', reason: 'Alta demanda de flores y ofrendas para ceremonias.' },
    { category: 'Convenience / Grocery', reason: 'Necesidades básicas de turistas y residentes en la zona.' },
  ],
  entertainment: [
    { category: 'Snacks / Comida rápida', reason: 'Estadios y parques de diversiones generan alta demanda de comida informal.' },
    { category: 'Souvenir / Merchandise', reason: 'Los asistentes a eventos buscan artículos de recuerdo y merchandise.' },
    { category: 'Fotografía / Impresión', reason: 'Impresión de fotos y recuerdos del evento.' },
    { category: 'Conveniencia', reason: 'Bebidas, snacks y artículos de uso rápido antes y después de eventos.' },
  ],
  nature: [
    { category: 'Renta de equipo outdoor', reason: 'Bicicletas, kayaks y equipo de campismo son muy solicitados cerca de parques y zoológicos.' },
    { category: 'Café / Restaurant', reason: 'Los visitantes de parques buscan opciones de alimentos al aire libre.' },
    { category: 'Snacks / Jugos naturales', reason: 'Alta demanda de opciones saludables y ligeras.' },
    { category: 'Fotografía / Impresión', reason: 'Los turistas de naturaleza buscan imprimir sus fotos localmente.' },
  ],
  lodging: [
    { category: 'Lavandería', reason: 'Huéspedes de hoteles y hostales requieren servicio de lavado frecuentemente.' },
    { category: 'Convenience / Grocery', reason: 'Turistas alojados buscan tiendas cercanas para artículos básicos.' },
    { category: 'Café / Desayunos', reason: 'Los viajeros buscan opciones de desayuno rápido cerca de su hospedaje.' },
    { category: 'Tour operator', reason: 'Viajeros hospedados buscan actividades y excursiones organizadas.' },
  ],
  mixed: [
    { category: 'Souvenir / Artesanías', reason: 'Zona con flujo turístico mixto — alta demanda de recuerdos generales.' },
    { category: 'Café', reason: 'Punto de descanso universal para cualquier tipo de turista.' },
    { category: 'Tour operator', reason: 'Diversidad de atracciones genera demanda de recorridos organizados.' },
    { category: 'Fotografía / Impresión', reason: 'Turistas de todo tipo buscan guardar recuerdos visuales.' },
  ],
};

// Which business categories make sense for each property type
const TIPO_COMPATIBILITY: Record<string, string[]> = {
  'Street-facing (with storefront)': [
    'Restaurant', 'Café', 'Café / Bakery', 'Bar', 'Pharmacy',
    'Beauty / Salon', 'Clothing / Retail', 'Retail', 'Convenience / Grocery', 'Bank / Finance',
  ],
  'Inside commercial plaza': [
    'Restaurant', 'Café', 'Café / Bakery', 'Pharmacy', 'Beauty / Salon',
    'Clothing / Retail', 'Retail', 'Gym / Wellness', 'Medical / Clinic', 'Bank / Finance',
  ],
  'Corner unit': [
    'Restaurant', 'Café', 'Bar', 'Pharmacy', 'Convenience / Grocery',
    'Clothing / Retail', 'Retail', 'Bank / Finance',
  ],
  'Basement / Semi-basement': [
    'Gym / Wellness', 'Laundry', 'Medical / Clinic', 'Bank / Finance', 'Retail',
  ],
  'Market stall': [
    'Convenience / Grocery', 'Café / Bakery', 'Retail', 'Restaurant',
  ],
};

const ALL_CATEGORIES = [...new Set(Object.values(TYPE_TO_CATEGORY))];

export interface Opportunity {
  category: string;
  count_500m: number;
  count_2km: number;
  score: 'high' | 'medium';
}

export interface Saturated {
  category: string;
  count_500m: number;
}

export interface TouristContext {
  zone_type: ZoneType;
  attraction_count: number;
  nearby_attractions: Array<{ name: string; type: string }>;
  suggestions: Array<{ category: string; reason: string }>;
}

interface NearbyPlace {
  name: string;
  category: string | null;
  vicinity: string;
  rating: number | null;
}

interface PlacesV2Result {
  displayName?: { text: string };
  types?: string[];
  formattedAddress?: string;
  rating?: number;
}

function categoryOf(types: string[]): string | null {
  for (const t of types) {
    if (TYPE_TO_CATEGORY[t]) return TYPE_TO_CATEGORY[t];
  }
  return null;
}

function countByCategory(places: PlacesV2Result[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of places) {
    const cat = categoryOf(p.types ?? []);
    if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}

function detectTouristContext(places: PlacesV2Result[]): TouristContext | null {
  if (places.length < 2) return null;

  // Count by tourist zone type
  const zoneCounts: Record<ZoneType, number> = {
    cultural: 0, religious: 0, entertainment: 0, nature: 0, lodging: 0, mixed: 0,
  };

  for (const p of places) {
    const types = p.types ?? [];
    if (types.some(t => ['museum', 'art_gallery', 'historical_landmark', 'monument', 'tourist_attraction'].includes(t)))
      zoneCounts.cultural++;
    if (types.some(t => ['church', 'hindu_temple', 'mosque', 'synagogue'].includes(t)))
      zoneCounts.religious++;
    if (types.some(t => ['amusement_park', 'stadium', 'performing_arts_theater'].includes(t)))
      zoneCounts.entertainment++;
    if (types.some(t => ['park', 'zoo'].includes(t)))
      zoneCounts.nature++;
    if (types.some(t => ['hotel', 'lodging'].includes(t)))
      zoneCounts.lodging++;
  }

  // Find dominant zone(s)
  const dominant = (Object.entries(zoneCounts) as [ZoneType, number][])
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a);

  if (dominant.length === 0) return null;

  const zone_type: ZoneType = dominant.length >= 2 && dominant[1][1] >= dominant[0][1] * 0.6
    ? 'mixed'
    : dominant[0][0];

  const nearby_attractions = places.slice(0, 5).map(p => ({
    name: p.displayName?.text ?? 'Desconocido',
    type: TOURIST_CATEGORY_MAP[(p.types ?? []).find(t => TOURIST_CATEGORY_MAP[t]) ?? ''] ?? 'Atracción',
  }));

  return {
    zone_type,
    attraction_count: places.length,
    nearby_attractions,
    suggestions: ZONE_SUGGESTIONS[zone_type],
  };
}

function analyzeOpportunities(
  within_500m: Record<string, number>,
  within_2km: Record<string, number>,
  tipoLocal: string | null,
): { opportunities: Opportunity[]; saturated: Saturated[] } {
  const compatible = tipoLocal
    ? (TIPO_COMPATIBILITY[tipoLocal] ?? ALL_CATEGORIES)
    : ALL_CATEGORIES;

  const opportunities: Opportunity[] = [];
  const saturated: Saturated[] = [];

  for (const cat of compatible) {
    const c500 = within_500m[cat] ?? 0;
    const c2k = within_2km[cat] ?? 0;

    if (c500 >= 4) {
      saturated.push({ category: cat, count_500m: c500 });
    } else if (c500 === 0 && c2k < 3) {
      opportunities.push({ category: cat, count_500m: c500, count_2km: c2k, score: 'high' });
    } else if (c500 <= 1 && c2k < 5) {
      opportunities.push({ category: cat, count_500m: c500, count_2km: c2k, score: 'medium' });
    }
  }

  opportunities.sort((a, b) => a.count_500m - b.count_500m || a.count_2km - b.count_2km);
  saturated.sort((a, b) => b.count_500m - a.count_500m);

  return { opportunities, saturated };
}

async function fetchNearbyV2(
  lat: number,
  lng: number,
  radius: number,
  key: string,
  includedTypes = INCLUDED_TYPES,
): Promise<PlacesV2Result[]> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.displayName,places.types,places.formattedAddress,places.rating',
      'Referer': appUrl,
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius },
      },
    }),
  });

  const data = await res.json();

  if (data.error) {
    const { code, message, status } = data.error;
    console.error(`[nearby-places] Google API error (radius=${radius}): ${status} ${code} — ${message}`);
    if (status === 'PERMISSION_DENIED') {
      throw new Error(
        `Google Places API key bloqueada: ${message}. ` +
        `Solución: en Google Cloud Console → Credenciales → edita la API key → ` +
        `cambia la restricción de "HTTP referrers" a "Ninguna" o agrega tu dominio (${appUrl}).`
      );
    }
    throw new Error(`Google Places API: ${message}`);
  }

  return (data.places ?? []) as PlacesV2Result[];
}

export async function POST(req: NextRequest) {
  const { lat, lng, tipoLocal } = await req.json();
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!key) return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
  if (lat == null || lng == null) return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });

  let r500: PlacesV2Result[], r5000: PlacesV2Result[], rTourist: PlacesV2Result[];
  try {
    [r500, r5000, rTourist] = await Promise.all([
      fetchNearbyV2(lat, lng, 500, key),
      fetchNearbyV2(lat, lng, 5000, key),
      fetchNearbyV2(lat, lng, 1000, key, TOURIST_TYPES),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al consultar Google Places';
    console.error('[nearby-places] Fatal:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const within_500m = countByCategory(r500);
  const within_2km = countByCategory(r5000);

  const top_nearby: NearbyPlace[] = r500.slice(0, 12).map((p) => ({
    name: p.displayName?.text ?? 'Unknown',
    category: categoryOf(p.types ?? []),
    vicinity: p.formattedAddress ?? '',
    rating: p.rating ?? null,
  }));

  const { opportunities, saturated } = analyzeOpportunities(within_500m, within_2km, tipoLocal ?? null);
  const tourist_context = detectTouristContext(rTourist);

  const result = { within_500m, within_2km, top_nearby, opportunities, saturated, tourist_context };

  return NextResponse.json(result);
}
