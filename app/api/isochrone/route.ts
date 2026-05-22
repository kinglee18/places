import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { lat, lng } = await req.json();
  const key = process.env.ORS_API_KEY;

  if (!key) return NextResponse.json({ error: 'ORS key not configured' }, { status: 500 });
  if (lat == null || lng == null) return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });

  const res = await fetch('https://api.openrouteservice.org/v2/isochrones/foot-walking', {
    method: 'POST',
    headers: { 'Authorization': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: [[lng, lat]],
      range_type: 'time',
      range: [900],
      interval: 300,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[isochrone] ORS error:', res.status, text);
    return NextResponse.json({ error: 'ORS error' }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ features: data.features ?? [] });
}
