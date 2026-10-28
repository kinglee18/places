/**
 * CARTO basemap tiles. CARTO now requires an API key on every tile request,
 * otherwise tiles render with an "API KEY REQUIRED" watermark.
 * The key is read from NEXT_PUBLIC_CARTO_API_KEY (must be referenced literally
 * so Next.js inlines it into the client bundle).
 */
export type CartoStyle = 'light_all' | 'dark_all';

export function cartoTileUrl(style: CartoStyle = 'light_all'): string {
  const base = `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`;
  const key = process.env.NEXT_PUBLIC_CARTO_API_KEY;
  return key ? `${base}?key=${encodeURIComponent(key)}` : base;
}
