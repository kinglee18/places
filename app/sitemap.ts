import { MetadataRoute } from 'next';

const BASE_URL = 'https://plaziia.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let properties: { id: string; updated_at: string | null }[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    const { data } = await supabase.from('properties').select('id, updated_at');
    properties = data ?? [];
  }

  const propertyEntries: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${BASE_URL}/propiedades/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/propiedades`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...propertyEntries,
  ];
}
