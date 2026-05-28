import { NextRequest, NextResponse } from 'next/server';

export interface ReverseGeocodeResult {
  colonia:  string | null;
  city:     string | null;
  state:    string | null;
  country:  string | null;
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lng);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'plaziia-app/1.0 (contact@plaziia.com)' },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Reverse geocode failed' }, { status: 502 });
  }

  const data = await res.json();
  const a = data.address ?? {};

  const result: ReverseGeocodeResult = {
    colonia: a.neighbourhood ?? a.suburb ?? a.quarter ?? a.village ?? null,
    city:    a.city ?? a.town ?? a.municipality ?? null,
    state:   a.state ?? null,
    country: a.country ?? null,
  };

  return NextResponse.json(result);
}
