import type { Metadata } from 'next';
import { Suspense } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale === 'es') {
    return {
      title: { absolute: 'Locales Comerciales en Renta en México | Plaziia' },
      description:
        'Encuentra locales en renta en México: tiendas, oficinas, bodegas y más. Analiza la competencia cercana y publica tu local gratis.',
      keywords: ['locales en renta', 'locales comerciales', 'renta de locales', 'propiedades comerciales México', 'bodegas en renta'],
      openGraph: {
        title: 'Locales Comerciales en Renta en México | Plaziia',
        description: 'Encuentra locales en renta en México. Analiza competencia y publica gratis.',
        locale: 'es_MX',
      },
      alternates: {
        canonical: 'https://plaziia.com/es/propiedades',
        languages: { es: 'https://plaziia.com/es/propiedades', en: 'https://plaziia.com/en/propiedades' },
      },
    };
  }
  return {
    title: { absolute: 'Commercial Properties for Rent in Mexico | Plaziia' },
    description: 'Browse commercial spaces for rent in Mexico: stores, offices, warehouses and more. Analyze nearby competition and publish for free.',
    alternates: {
      canonical: 'https://plaziia.com/en/propiedades',
      languages: { es: 'https://plaziia.com/es/propiedades', en: 'https://plaziia.com/en/propiedades' },
    },
  };
}

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { getSupabase } from '@/lib/supabase';
import NavHeader from '@/components/NavHeader';
import PropiedadesFilters from '@/components/PropiedadesFilters';
import PropertyCard from '@/components/PropertyCard';

const PropertiesListMap = dynamic(() => import('@/components/PropertiesListMap'), {
  ssr: true,
  loading: () => (
    <div
      style={{
        height: 560,
        borderRadius: 16,
        background: '#edf0f8',
        border: '1px solid #d5daea',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ color: '#9099b8', fontSize: 13 }}>Loading map…</span>
    </div>
  ),
});

const PAGE_SIZE = 12;

interface Property {
  id: string;
  colonia: string;
  calle: string | null;
  numero: string | null;
  tipo_local: string;
  m2: number;
  banos: number;
  habitaciones: number;
  estacionamientos: number;
  modalidad: string | null;
  precio_inmueble: number | null;
  precio_mantenimiento: number | null;
  descripcion: string | null;
  photo_urls: string[];
  nivel_piso: string | null;
  created_at: string;
  city: string | null;
  state: string | null;
  estado_conservacion: string | null;
  uso_suelo: string | null;
  tipo_energia: string | null;
  lat: number | null;
  lng: number | null;
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function PropiedadesPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations('PropiedadesPage');
  const params = await searchParams;

  const str = (k: string) => (Array.isArray(params[k]) ? params[k][0] : params[k] ?? '') as string;

  const search    = str('search');
  const colonia   = str('colonia');
  const tipo      = str('tipo');
  const modalidad = str('modalidad');
  const condicion = str('condicion');
  const zoning    = str('zoning');
  const energia   = str('energia');
  const sort      = str('sort') || 'recent';
  const page      = Math.max(1, Number(str('page')) || 1);

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const SELECT =
    'id, colonia, calle, numero, tipo_local, m2, banos, habitaciones, estacionamientos, modalidad, ' +
    'precio_inmueble, precio_mantenimiento, descripcion, photo_urls, nivel_piso, created_at, ' +
    'city, state, estado_conservacion, uso_suelo, tipo_energia, lat, lng';

  const nowIso    = new Date().toISOString();
  const notExpired = `expires_at.is.null,expires_at.gt.${nowIso}`;

  let q = getSupabase()
    .from('properties')
    .select(SELECT, { count: 'exact' })
    .eq('is_published', true)
    .or(notExpired);

  if (search)    q = q.or(`colonia.ilike.%${search}%,calle.ilike.%${search}%,descripcion.ilike.%${search}%`);
  if (colonia)   q = q.eq('colonia', colonia);
  if (tipo)      q = q.eq('tipo_local', tipo);
  if (modalidad) q = q.eq('modalidad', modalidad);
  if (condicion) q = q.eq('estado_conservacion', condicion);
  if (zoning)    q = q.eq('uso_suelo', zoning);
  if (energia)   q = q.eq('tipo_energia', energia);

  if (sort === 'precio-asc')  q = q.order('precio_inmueble', { ascending: true,  nullsFirst: false });
  else if (sort === 'precio-desc') q = q.order('precio_inmueble', { ascending: false, nullsFirst: false });
  else if (sort === 'm2-asc')  q = q.order('m2', { ascending: true });
  else if (sort === 'm2-desc') q = q.order('m2', { ascending: false });
  else                          q = q.order('created_at', { ascending: false });

  q = q.range(from, to);

  const [{ data: properties, count }, { data: allData }] = await Promise.all([
    q,
    getSupabase()
      .from('properties')
      .select('colonia, tipo_local, estado_conservacion, uso_suelo, tipo_energia')
      .eq('is_published', true)
      .or(notExpired),
  ]);

  const unique = <T,>(arr: (T | null | undefined)[]): T[] =>
    [...new Set(arr.filter((v): v is T => v != null && v !== ''))];

  const filterOptions = {
    colonias:    unique(allData?.map(p => p.colonia) ?? []),
    tipos:       unique(allData?.map(p => p.tipo_local) ?? []),
    condiciones: unique(allData?.map(p => p.estado_conservacion) ?? []),
    zonings:     unique(allData?.map(p => p.uso_suelo) ?? []),
    energias:    unique(allData?.map(p => p.tipo_energia) ?? []),
  };

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const items = (properties ?? []) as unknown as Property[];

  const mapPins = items
    .filter(p => p.lat != null && p.lng != null)
    .map(p => ({
      id: p.id,
      lat: p.lat!,
      lng: p.lng!,
      label: `${p.tipo_local} · ${p.colonia}`,
    }));

  const pageUrl = (p: number) => {
    const ps = new URLSearchParams();
    if (search)    ps.set('search', search);
    if (colonia)   ps.set('colonia', colonia);
    if (tipo)      ps.set('tipo', tipo);
    if (modalidad) ps.set('modalidad', modalidad);
    if (condicion) ps.set('condicion', condicion);
    if (zoning)    ps.set('zoning', zoning);
    if (energia)   ps.set('energia', energia);
    if (sort !== 'recent') ps.set('sort', sort);
    if (p > 1)     ps.set('page', String(p));
    const qs = ps.toString();
    return `/propiedades${qs ? `?${qs}` : ''}`;
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'oklch(0.985 0.005 240)',
        color: '#181e38',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <NavHeader activePage="propiedades" />

      {/* Responsive helpers */}
      <style>{`
        @media (max-width: 900px) {
          .props-map-col { display: none !important; }
          .props-split   { display: block !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'oklch(0.55 0.11 250)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            {t('eyebrow')}
          </span>
          <h1
            style={{
              fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 8,
              letterSpacing: '-0.02em',
              color: '#181e38',
            }}
          >
            {t('heading')}
          </h1>
          <p style={{ color: '#5a6288', fontSize: 15 }}>
            {t('countFound', { count: count ?? 0 })}
            {' · '}{t('aiScore')}
          </p>
        </div>

        {/* ── Filters ── */}
        <Suspense
          fallback={
            <div
              style={{
                height: 120,
                background: '#edf0f8',
                borderRadius: 16,
                marginBottom: 28,
                border: '1px solid #d5daea',
              }}
            />
          }
        >
          <PropiedadesFilters filterOptions={filterOptions} />
        </Suspense>

        {/* ── Split layout: Map left · List right ── */}
        <div
          className="props-split"
          style={{ display: 'flex', gap: 24, alignItems: 'start' }}
        >
          {/* Left — sticky map */}
          <div
            className="props-map-col"
            style={{ width: 420, flexShrink: 0, position: 'sticky', top: 80 }}
          >
            <PropertiesListMap pins={mapPins} />
            {mapPins.length === 0 && (
              <p
                style={{
                  marginTop: 10,
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#9099b8',
                }}
              >
                {t('noMapData')}
              </p>
            )}
          </div>

          {/* Right — scrollable list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px', color: '#5a6288' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#181e38' }}>
                  {t('noResults')}
                </p>
                <p style={{ fontSize: 15 }}>{t('noResultsHint')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map(p => (
                  <PropertyCard key={p.id} {...p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 40,
                }}
              >
                {page > 1 && (
                  <Link href={pageUrl(page - 1)} style={pageBtnStyle(false)}>
                    {t('prev')}
                  </Link>
                )}
                {buildPageRange(page, totalPages).map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} style={{ color: '#5a6288', padding: '0 4px' }}>
                      …
                    </span>
                  ) : (
                    <Link key={p} href={pageUrl(p as number)} style={pageBtnStyle(p === page)}>
                      {p}
                    </Link>
                  )
                )}
                {page < totalPages && (
                  <Link href={pageUrl(page + 1)} style={pageBtnStyle(false)}>
                    {t('next')}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── CTA ── */}
        <div
          style={{
            marginTop: 64,
            padding: '40px 36px',
            background: 'linear-gradient(135deg, rgba(15,27,61,0.04), rgba(59,111,160,0.06))',
            border: '1px solid rgba(59,111,160,0.18)',
            borderRadius: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 12 }}>🏢</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#181e38' }}>
            {t('ctaHeading')}
          </h2>
          <p style={{ color: '#5a6288', fontSize: 15, marginBottom: 24 }}>
            {t('ctaBody')}
          </p>
          <Link
            href="/registro"
            style={{
              background: 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
              color: '#ffffff',
              padding: '13px 32px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              display: 'inline-block',
              boxShadow: '0 6px 24px rgba(15,27,61,0.18)',
            }}
          >
            {t('ctaBtn')}
          </Link>
        </div>
      </div>
    </main>
  );
}

function pageBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
    height: 38,
    padding: '0 12px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    textDecoration: 'none',
    background: active ? 'linear-gradient(135deg, #0f1b3d, #3b6fa0)' : '#ffffff',
    color: active ? '#ffffff' : '#5a6288',
    border: active ? 'none' : '1px solid #d5daea',
    transition: 'all 0.15s',
  };
}

function buildPageRange(current: number, total: number): (number | '…')[] {
  const delta = 2;
  const range: (number | '…')[] = [];
  let prev = 0;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      if (prev && i - prev > 1) range.push('…');
      range.push(i);
      prev = i;
    }
  }
  return range;
}
