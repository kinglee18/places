import { NextRequest, NextResponse } from 'next/server';

// Maps Google place types → our business categories
const TYPE_TO_CATEGORY: Record<string, string> = {
  cafe:                      'Café',
  bakery:                    'Café / Bakery',
  restaurant:                'Restaurant',
  meal_takeaway:             'Restaurant',
  meal_delivery:             'Restaurant',
  bar:                       'Bar',
  night_club:                'Bar',
  gym:                       'Gym / Wellness',
  spa:                       'Gym / Wellness',
  pharmacy:                  'Pharmacy',
  drugstore:                 'Pharmacy',
  supermarket:               'Convenience / Grocery',
  grocery_or_supermarket:    'Convenience / Grocery',
  convenience_store:         'Convenience / Grocery',
  beauty_salon:              'Beauty / Salon',
  hair_care:                 'Beauty / Salon',
  clothing_store:            'Clothing / Retail',
  store:                     'Retail',
  laundry:                   'Laundry',
  dentist:                   'Medical / Clinic',
  doctor:                    'Medical / Clinic',
  hospital:                  'Medical / Clinic',
  bank:                      'Bank / Finance',
  atm:                       'Bank / Finance',
};

interface NearbyPlace {
  name: string;
  category: string | null;
  vicinity: string;
  rating: number | null;
}

function categoryOf(types: string[]): string | null {
  for (const t of types) {
    if (TYPE_TO_CATEGORY[t]) return TYPE_TO_CATEGORY[t];
  }
  return null;
}

function countByCategory(places: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of places) {
    const cat = categoryOf(p.types ?? []);
    if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}

async function fetchNearby(lat: number, lng: number, radius: number, key: string) {
  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${lat},${lng}&radius=${radius}&type=establishment&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.results ?? []) as any[];
}

export async function POST(req: NextRequest) {
  const { lat, lng } = await req.json();
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!key) {
    return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
  }
  if (lat == null || lng == null) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const [r500, r2000] = await Promise.all([
    fetchNearby(lat, lng, 500, key),
    fetchNearby(lat, lng, 2000, key),
  ]);

  const top_nearby: NearbyPlace[] = r500.slice(0, 12).map((p: any) => ({
    name: p.name,
    category: categoryOf(p.types ?? []),
    vicinity: p.vicinity,
    rating: p.rating ?? null,
  }));

  return NextResponse.json({
    within_500m: countByCategory(r500),
    within_2km:  countByCategory(r2000),
    top_nearby,
  });
}
