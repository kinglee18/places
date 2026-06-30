import { MetadataRoute } from 'next';

const BASE_URL = 'https://plaziia.com';
const LOCALES = ['es', 'en'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let properties: { id: string; updated_at: string | null }[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    const { data } = await supabase.from('properties').select('id, updated_at').eq('is_published', true);
    properties = data ?? [];
  }

  const propertyEntries: MetadataRoute.Sitemap = properties.flatMap((p) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}/propiedades/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  const staticPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    {
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/${locale}/propiedades`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/${locale}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/${locale}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ]);

  return [...staticPages, ...propertyEntries];
}
