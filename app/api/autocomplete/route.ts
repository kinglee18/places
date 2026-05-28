import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 2) return NextResponse.json({ predictions: [] });

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '6');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('featuretype', 'settlement');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'plaziia-app/1.0 (contact@plaziia.com)' },
  });

  if (!res.ok) return NextResponse.json({ predictions: [] });

  const results = await res.json();

  const predictions = results.map((r: { display_name: string; place_id: number; lat: string; lon: string }) => ({
    label: r.display_name,
    placeId: String(r.place_id),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));

  return NextResponse.json({ predictions });
}
