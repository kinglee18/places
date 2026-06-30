import type { Metadata } from 'next';
import { getSupabase } from '@/lib/supabase';
import PropertyDetailClient from './PropertyDetailClient';

const TIPO_ES: Record<string, string> = {
  'Street-facing (with storefront)': 'Local frontal',
  'Inside commercial plaza': 'Local en plaza',
  'Corner unit': 'Local en esquina',
  'Basement / Semi-basement': 'Sótano comercial',
  'Market stall': 'Puesto de mercado',
};

async function getPropertyForSEO(id: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('properties')
    .select('colonia, tipo_local, m2, precio_inmueble, modalidad, descripcion, city, state, photo_urls')
    .eq('id', id)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const p = await getPropertyForSEO(id);

  if (!p) return { title: 'Propiedad | Plaziia' };

  const tipo = locale === 'es' ? (TIPO_ES[p.tipo_local] ?? p.tipo_local) : p.tipo_local;
  const price = p.precio_inmueble
    ? `$${p.precio_inmueble.toLocaleString('es-MX')} MXN`
    : null;
  const location = [p.colonia, p.city, p.state].filter(Boolean).join(', ');

  const title =
    locale === 'es'
      ? `${tipo} en renta en ${p.colonia}${price ? ` — ${price}` : ''} | Plaziia`
      : `${p.tipo_local} for Rent in ${p.colonia}${price ? ` — ${price}` : ''} | Plaziia`;

  const desc =
    locale === 'es'
      ? `${tipo} de ${p.m2}m² en ${location}. ${p.descripcion?.slice(0, 120) ?? 'Local comercial disponible en Plaziia.'}`.trim()
      : `${p.tipo_local} of ${p.m2}m² in ${location}. ${p.descripcion?.slice(0, 120) ?? 'Commercial space available on Plaziia.'}`.trim();

  return {
    title: { absolute: title },
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: p.photo_urls?.[0] ? [{ url: p.photo_urls[0] }] : [],
      locale: locale === 'es' ? 'es_MX' : 'en_US',
    },
    alternates: {
      canonical: `https://plaziia.com/${locale}/propiedades/${id}`,
      languages: {
        es: `https://plaziia.com/es/propiedades/${id}`,
        en: `https://plaziia.com/en/propiedades/${id}`,
      },
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const p = await getPropertyForSEO(id);

  const schema = p
    ? {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: `${locale === 'es' ? (TIPO_ES[p.tipo_local] ?? p.tipo_local) : p.tipo_local} en ${p.colonia}`,
        description: p.descripcion ?? undefined,
        url: `https://plaziia.com/${locale}/propiedades/${id}`,
        floorSize: { '@type': 'QuantitativeValue', value: p.m2, unitCode: 'MTK' },
        priceCurrency: 'MXN',
        address: {
          '@type': 'PostalAddress',
          addressLocality: p.colonia,
          addressRegion: p.state ?? undefined,
          addressCountry: 'MX',
        },
        image: p.photo_urls?.[0] ?? undefined,
        offers: p.precio_inmueble
          ? {
              '@type': 'Offer',
              price: p.precio_inmueble,
              priceCurrency: 'MXN',
              availability: 'https://schema.org/InStock',
            }
          : undefined,
      }
    : null;

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <PropertyDetailClient />
    </>
  );
}
