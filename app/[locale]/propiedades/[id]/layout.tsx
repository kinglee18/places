import type { Metadata } from 'next';
import { getSupabase } from '@/lib/supabase';

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const supabase = getSupabase();

  const { data } = await supabase
    .from('properties')
    .select('name, neighborhood, property_type')
    .eq('id', id)
    .single();

  if (!data) return {};

  const title = data.name ?? 'Property';
  const description = `${data.property_type ?? 'Commercial space'} in ${data.neighborhood ?? 'Mexico'} — view details, competitors, and analytics on Plaziia.`;

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: {
      canonical: `https://plaziia.com/${locale}/propiedades/${id}`,
      languages: {
        es: `https://plaziia.com/es/propiedades/${id}`,
        en: `https://plaziia.com/en/propiedades/${id}`,
        'x-default': `https://plaziia.com/es/propiedades/${id}`,
      },
    },
  };
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
