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
};

const INCLUDED_TYPES = Object.keys(TYPE_TO_CATEGORY);

// Google Places v2 types that signal a tourist zone
const TOURIST_TYPES = [
  'tourist_attraction', 'museum', 'art_gallery', 'historical_landmark',
  'monument', 'amusement_park', 'park', 'zoo',
  'church', 'hindu_temple', 'mosque', 'synagogue', 'stadium', 'performing_arts_theater',
];

// Maps tourist Google type → display label
const TOURIST_CATEGORY_MAP: Record<string, string> = {
  tourist_attraction: 'Tourist attraction',
  museum: 'Museum',
  art_gallery: 'Art gallery',
  historical_landmark: 'Historical landmark',
  monument: 'Monument',
  amusement_park: 'Amusement park',
  park: 'Park',
  zoo: 'Zoo',
  church: 'Church',
  hindu_temple: 'Temple',
  mosque: 'Mosque',
  synagogue: 'Synagogue',
  stadium: 'Stadium',
  performing_arts_theater: 'Theater',
};

const TRANSIT_TYPES = [
  'transit_station', 'subway_station', 'bus_station',
  'light_rail_station', 'train_station',
];

const TRANSIT_ICON: Record<string, string> = {
  subway_station: '🚇',
  train_station: '🚂',
  light_rail_station: '🚊',
  bus_station: '🚌',
  transit_station: '🚉',
};

type ZoneType = 'cultural' | 'religious' | 'entertainment' | 'nature' | 'lodging' | 'mixed';

// Business suggestions per tourist zone type
const ZONE_SUGGESTIONS: Record<ZoneType, Array<{ category: string; reason: string }>> = {
  cultural: [
    { category: 'Souvenir / Crafts', reason: 'Museum and historic district visitors look for local mementos.' },
    { category: 'Themed café', reason: 'Cultural tourists value spaces to rest and socialize between visits.' },
    { category: 'Tour operator', reason: 'High demand for guided tours and organized experiences.' },
    { category: 'Photo / Print shop', reason: 'Visitors want to print or frame photos from their trip.' },
    { category: 'Bookstore / Art', reason: 'Books, catalogs, and local art reproductions sell well here.' },
  ],
  religious: [
    { category: 'Religious articles', reason: 'Visitors and worshippers seek candles, icons, and devotional items.' },
    { category: 'Café / Bakery', reason: 'Religious-zone visitors look for nearby rest options.' },
    { category: 'Flower shop', reason: 'High demand for flowers and offerings for ceremonies.' },
    { category: 'Convenience / Grocery', reason: 'Basic needs for tourists and residents in the area.' },
  ],
  entertainment: [
    { category: 'Snacks / Fast food', reason: 'Stadiums and amusement parks drive high demand for casual food.' },
    { category: 'Souvenir / Merchandise', reason: 'Event attendees look for memorabilia and branded goods.' },
    { category: 'Photo / Print shop', reason: 'Photo printing and event souvenirs.' },
    { category: 'Convenience store', reason: 'Drinks, snacks, and quick-use items before and after events.' },
  ],
  nature: [
    { category: 'Outdoor gear rental', reason: 'Bicycles, kayaks, and camping equipment are in high demand near parks and zoos.' },
    { category: 'Café / Restaurant', reason: 'Park visitors look for outdoor dining options.' },
    { category: 'Snacks / Juices', reason: 'High demand for healthy and light options.' },
    { category: 'Photo / Print shop', reason: 'Nature tourists want to print their photos locally.' },
  ],
  lodging: [
    { category: 'Laundry', reason: 'Hotel and hostel guests frequently need laundry service.' },
    { category: 'Convenience / Grocery', reason: 'Staying tourists look for nearby stores for essentials.' },
    { category: 'Café / Breakfast', reason: 'Travelers want quick breakfast options near their accommodation.' },
    { category: 'Tour operator', reason: 'Hotel guests seek organized activities and excursions.' },
  ],
  mixed: [
    { category: 'Souvenir / Crafts', reason: 'Mixed tourist flow zone — high demand for general souvenirs.' },
    { category: 'Café', reason: 'Universal rest point for any type of tourist.' },
    { category: 'Tour operator', reason: 'Diverse attractions generate demand for organized tours.' },
    { category: 'Photo / Print shop', reason: 'Tourists of all types want to save visual memories.' },
  ],
};

// Which business categories make sense for each property type.
// "Bank / Finance" is intentionally excluded — it requires special licensing
// and is not a viable opportunity for typical small/medium entrepreneurs.
const TIPO_COMPATIBILITY: Record<string, string[]> = {
  'Street-facing (with storefront)': [
    'Restaurant', 'Café', 'Café / Bakery', 'Bar', 'Pharmacy',
    'Beauty / Salon', 'Clothing / Retail', 'Retail', 'Convenience / Grocery', 'Laundry',
  ],
  'Inside commercial plaza': [
    'Restaurant', 'Café', 'Café / Bakery', 'Pharmacy', 'Beauty / Salon',
    'Clothing / Retail', 'Retail', 'Gym / Wellness', 'Medical / Clinic',
  ],
  'Corner unit': [
    'Restaurant', 'Café', 'Bar', 'Pharmacy', 'Convenience / Grocery',
    'Clothing / Retail', 'Retail',
  ],
  'Basement / Semi-basement': [
    'Gym / Wellness', 'Laundry', 'Medical / Clinic', 'Retail',
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
  location?: { latitude: number; longitude: number };
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

function metersAway(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Food subcategory detection ────────────────────────────────────────────────
// Maps cuisine label → keywords to detect in business names (lowercase).
// Used to find gaps: cuisines present in the wider area (demand proven) but
// absent within 500m (opportunity).
const CUISINE_KEYWORDS: Record<string, string[]> = {
  'Chinese':             ['china', 'chinese', 'chino', 'chifa', 'wok', 'dim sum', 'szechuan', 'cantonese'],
  'Japanese / Sushi':    ['japan', 'japanese', 'sushi', 'ramen', 'udon', 'teppan', 'yakitori', 'nikkei', 'tempura'],
  'Italian / Pizza':     ['pizza', 'italian', 'pasta', 'pizzeria', 'trattoria', 'osteria', 'lasagna'],
  'Seafood':             ['mariscos', 'marisco', 'seafood', 'ceviche', 'ostiones', 'camarones', 'pescado', 'fish'],
  'Vegan / Vegetarian':  ['vegan', 'vegano', 'vegetarian', 'vegetariano', 'plant based', 'organic'],
  'Korean BBQ':          ['korean', 'koreano', 'korea', 'bbq', 'kimchi', 'grill'],
  'Thai':                ['thai', 'thailand', 'tailandes', 'tailandesa'],
  'Indian':              ['india', 'indian', 'curry', 'tandoor', 'masala', 'biryani'],
  'Burgers':             ['burger', 'smash', 'hamburger', 'hamburgesa', 'burguer'],
  'Breakfast / Brunch':  ['breakfast', 'brunch', 'desayuno', 'chilaquiles', 'pancake', 'waffle', 'huevos'],
  'Ice cream / Desserts':['helado', 'ice cream', 'gelato', 'nieves', 'postre', 'dessert', 'nieve'],
  'Tacos / Street food': ['taco', 'tacos', 'taqueria', 'birria', 'barbacoa', 'carnitas', 'quesadilla', 'torta'],
  'Coffee / Specialty':  ['specialty coffee', 'third wave', 'artisan coffee', 'cold brew', 'espresso bar'],
  'Bakery / Pastry':     ['bakery', 'panaderia', 'pasteleria', 'reposteria', 'boulangerie'],
};

const FOOD_TYPES = new Set([
  'restaurant', 'fast_food_restaurant', 'meal_takeaway', 'meal_delivery', 'cafe', 'coffee_shop', 'bakery',
]);

function detectFoodSubcategories(
  r500: PlacesV2Result[],
  r5000: PlacesV2Result[],
): { present_500m: string[]; present_5km: string[]; gaps: string[] } {
  const detect = (places: PlacesV2Result[]): string[] => {
    const found = new Set<string>();
    for (const p of places) {
      const name = (p.displayName?.text ?? '').toLowerCase();
      const isFood = (p.types ?? []).some(t => FOOD_TYPES.has(t));
      if (!isFood) continue;
      for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
        if (keywords.some(k => name.includes(k))) found.add(cuisine);
      }
    }
    return [...found];
  };

  const present_500m = detect(r500);
  const present_5km  = detect(r5000);
  const gaps = present_5km.filter(c => !present_500m.includes(c));

  return { present_500m, present_5km, gaps };
}

// Places people specifically travel to visit — the gateway for tourist zone classification.
// Only use types Google assigns exclusively to real tourist destinations.
// historical_landmark and monument are too broad — Google applies them to minor local sites.
const GENUINE_ATTRACTOR_TYPES = new Set([
  'tourist_attraction',
  'museum',
  'art_gallery',
]);

function detectTouristContext(places: PlacesV2Result[]): TouristContext | null {
  if (places.length < 2) return null;

  const hasGenuineAttractor = places.some(p =>
    (p.types ?? []).some(t => GENUINE_ATTRACTOR_TYPES.has(t))
  );
  if (!hasGenuineAttractor) return null;

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
    name: p.displayName?.text ?? 'Unknown',
    type: TOURIST_CATEGORY_MAP[(p.types ?? []).find(t => TOURIST_CATEGORY_MAP[t]) ?? ''] ?? 'Attraction',
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
  fieldMask = 'places.displayName,places.types,places.formattedAddress,places.rating',
): Promise<PlacesV2Result[]> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': fieldMask,
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
        `Google Places API key blocked: ${message}. ` +
        `Fix: in Google Cloud Console → Credentials → edit the API key → ` +
        `change the restriction from "HTTP referrers" to "None" or add your domain (${appUrl}).`
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

  let r500: PlacesV2Result[], r5000: PlacesV2Result[], rTourist: PlacesV2Result[], rTransit: PlacesV2Result[];
  try {
    [r500, r5000, rTourist, rTransit] = await Promise.all([
      fetchNearbyV2(lat, lng, 500, key),
      fetchNearbyV2(lat, lng, 5000, key),
      fetchNearbyV2(lat, lng, 1000, key, TOURIST_TYPES),
      fetchNearbyV2(lat, lng, 1500, key, TRANSIT_TYPES, 'places.displayName,places.types,places.location'),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error querying Google Places';
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
  const food_subcategories = detectFoodSubcategories(r500, r5000);

  const nearby_transit = rTransit.slice(0, 5).map(p => {
    const typeKey = (p.types ?? []).find(t => TRANSIT_ICON[t]) ?? 'transit_station';
    const dist = p.location
      ? metersAway(lat, lng, p.location.latitude, p.location.longitude)
      : null;
    return {
      name: p.displayName?.text ?? 'Unknown',
      type: typeKey,
      icon: TRANSIT_ICON[typeKey] ?? '🚉',
      distance_m: dist !== null ? Math.round(dist) : null,
    };
  }).sort((a, b) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity));

  const result = { within_500m, within_2km, top_nearby, opportunities, saturated, tourist_context, nearby_transit, food_subcategories };

  return NextResponse.json(result);
}
