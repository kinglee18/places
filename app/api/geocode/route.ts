import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!key) {
    return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.[0]) {
    return NextResponse.json({ error: 'Could not geocode address', status: data.status }, { status: 400 });
  }

  const { lat, lng } = data.results[0].geometry.location;
  return NextResponse.json({ lat, lng });
}
