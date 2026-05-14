import { Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import NavHeader from '@/components/NavHeader';
import PropiedadesFilters from '@/components/PropiedadesFilters';
import PropertyCard from '@/components/PropertyCard';

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
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function PropiedadesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const str = (k: string) => (Array.isArray(params[k]) ? params[k][0] : params[k] ?? '') as string;

  const search   = str('search');
  const colonia  = str('colonia');
  const tipo     = str('tipo');
  const modalidad = str('modalidad');
  const condicion = str('condicion');
  const zoning   = str('zoning');
  const energia  = str('energia');
  const sort     = str('sort') || 'recent';
  const page     = Math.max(1, Number(str('page')) || 1);

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const SELECT = 'id, colonia, calle, numero, tipo_local, m2, banos, habitaciones, estacionamientos, modalidad, precio_inmueble, precio_mantenimiento, descripcion, photo_urls, nivel_piso, created_at, city, state, estado_conservacion, uso_suelo, tipo_energia';

  // Main query with filters
  let q = supabase.from('properties').select(SELECT, { count: 'exact' }).eq('is_published', true);

  if (search)   q = q.or(`colonia.ilike.%${search}%,calle.ilike.%${search}%,descripcion.ilike.%${search}%`);
  if (colonia)  q = q.eq('colonia', colonia);
  if (tipo)     q = q.eq('tipo_local', tipo);
  if (modalidad) q = q.eq('modalidad', modalidad);
  if (condicion) q = q.eq('estado_conservacion', condicion);
  if (zoning)   q = q.eq('uso_suelo', zoning);
  if (energia)  q = q.eq('tipo_energia', energia);

  if (sort === 'precio-asc')  q = q.order('precio_inmueble', { ascending: true,  nullsFirst: false });
  else if (sort === 'precio-desc') q = q.order('precio_inmueble', { ascending: false, nullsFirst: false });
  else if (sort === 'm2-asc')  q = q.order('m2', { ascending: true });
  else if (sort === 'm2-desc') q = q.order('m2', { ascending: false });
  else                         q = q.order('created_at', { ascending: false });

  q = q.range(from, to);

  // Filter options query (all published, no pagination)
  const [{ data: properties, count }, { data: allData }] = await Promise.all([
    q,
    supabase.from('properties')
      .select('colonia, tipo_local, estado_conservacion, uso_suelo, tipo_energia')
      .eq('is_published', true),
  ]);

  const unique = <T,>(arr: (T | null | undefined)[]): T[] =>
    [...new Set(arr.filter((v): v is T => v != null && v !== ''))];

  const filterOptions = {
    colonias:   unique(allData?.map(p => p.colonia) ?? []),
    tipos:      unique(allData?.map(p => p.tipo_local) ?? []),
    condiciones: unique(allData?.map(p => p.estado_conservacion) ?? []),
    zonings:    unique(allData?.map(p => p.uso_suelo) ?? []),
    energias:   unique(allData?.map(p => p.tipo_energia) ?? []),
  };

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const items = (properties ?? []) as Property[];

  // Build a URL helper that preserves current params
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
    <main style={{ minHeight: '100vh', background: '#06060f', color: '#f0f0f8', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader activePage="propiedades" />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00f5a0', display: 'block', marginBottom: '10px' }}>
            Platform
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
            Available properties
          </h1>
          <p style={{ color: '#6b6b9a', fontSize: '16px' }}>
            {count ?? 0} {(count ?? 0) === 1 ? 'property found' : 'properties found'}
          </p>
        </div>

        {/* Filters — client component inside Suspense for useSearchParams */}
        <Suspense fallback={<div style={{ height: 120, background: '#0d0d1a', borderRadius: 16, marginBottom: 36 }} />}>
          <PropiedadesFilters filterOptions={filterOptions} />
        </Suspense>

        {/* Grid */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#6b6b9a' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#9090b8' }}>No results</p>
            <p style={{ fontSize: '15px' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {items.map(p => (
              <PropertyCard key={p.id} {...p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 48 }}>
            {page > 1 && (
              <Link href={pageUrl(page - 1)} style={pageBtnStyle(false)}>← Prev</Link>
            )}
            {buildPageRange(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} style={{ color: '#6b6b9a', padding: '0 4px' }}>…</span>
              ) : (
                <Link key={p} href={pageUrl(p as number)} style={pageBtnStyle(p === page)}>{p}</Link>
              )
            )}
            {page < totalPages && (
              <Link href={pageUrl(page + 1)} style={pageBtnStyle(false)}>Next →</Link>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{
          marginTop: '64px', padding: '40px 36px',
          background: 'linear-gradient(135deg, rgba(0,245,160,0.05), rgba(0,180,216,0.05))',
          border: '1px solid rgba(0,245,160,0.15)', borderRadius: '20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🏢</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Do you have a property?</h2>
          <p style={{ color: '#6b6b9a', fontSize: '15px', marginBottom: '24px' }}>Publish it for free or unlock the Pro area analysis.</p>
          <Link href="/registro" style={{
            background: 'linear-gradient(135deg, #00f5a0, #00b4d8)', color: '#06060f',
            padding: '13px 32px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
            display: 'inline-block', boxShadow: '0 6px 24px rgba(0,245,160,0.25)',
          }}>
            Publish my property →
          </Link>
        </div>

      </div>
    </main>
  );
}

function pageBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 38, height: 38, padding: '0 12px',
    borderRadius: 10, fontSize: 13, fontWeight: active ? 700 : 500,
    textDecoration: 'none',
    background: active ? 'linear-gradient(135deg, #00f5a0, #00b4d8)' : '#0d0d1a',
    color: active ? '#06060f' : '#9090b8',
    border: active ? 'none' : '1px solid #1e1e35',
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
