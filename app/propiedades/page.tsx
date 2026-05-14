'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import NavHeader from '../../components/NavHeader';

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
  agua_drenaje: string | null;
  modalidad: string | null;
  precio_inmueble: number | null;
  precio_mantenimiento: number | null;
  descripcion: string | null;
  photo_urls: string[];
  nivel_piso: string | null;
  created_at: string;
  estado_conservacion: string | null;
  uso_suelo: string | null;
  tipo_energia: string | null;
}

const TIPO_ICONS: Record<string, string> = {
  'Street-facing (with storefront)': '🪟',
  'Inside commercial plaza': '🏬',
  'Corner unit': '🔀',
  'Basement / Semi-basement': '⬇️',
  'Market stall': '🛒',
};

function formatPrice(val: number | null, modalidad?: string | null): string {
  if (!val) return '—';
  const label = modalidad === 'rent' ? '/mo' : '';
  return `$${val.toLocaleString('en-US')} MXN${label}`;
}

export default function PropiedadesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [coloniaFilter, setColoniaFilter] = useState('All');
  const [tipoFilter, setTipoFilter] = useState('All');
  const [modalidadFilter, setModalidadFilter] = useState('All');
  const [condicionFilter, setCondicionFilter] = useState('All');
  const [zoningFilter, setZoningFilter] = useState('All');
  const [energiaFilter, setEnergiaFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'precio-asc' | 'precio-desc' | 'm2-asc' | 'm2-desc'>('precio-asc');

  useEffect(() => {
    fetch('/api/properties?published=true')
      .then(r => r.json())
      .then((data: Property[]) => {
        setProperties(data ?? []);
        setLoading(false);
      });
  }, []);

  const colonias   = ['All', ...Array.from(new Set(properties.map(p => p.colonia)))];
  const tipos      = ['All', ...Array.from(new Set(properties.map(p => p.tipo_local)))];
  const condiciones = ['All', ...Array.from(new Set(properties.map(p => p.estado_conservacion).filter(Boolean))) as string[]];
  const zonings    = ['All', ...Array.from(new Set(properties.map(p => p.uso_suelo).filter(Boolean))) as string[]];
  const energias   = ['All', ...Array.from(new Set(properties.map(p => p.tipo_energia).filter(Boolean))) as string[]];

  const hasActiveFilters = search || coloniaFilter !== 'All' || tipoFilter !== 'All' ||
    modalidadFilter !== 'All' || condicionFilter !== 'All' || zoningFilter !== 'All' || energiaFilter !== 'All';

  const filtered = properties
    .filter(p => coloniaFilter === 'All' || p.colonia === coloniaFilter)
    .filter(p => tipoFilter === 'All' || p.tipo_local === tipoFilter)
    .filter(p => modalidadFilter === 'All' || p.modalidad === modalidadFilter)
    .filter(p => condicionFilter === 'All' || p.estado_conservacion === condicionFilter)
    .filter(p => zoningFilter === 'All' || p.uso_suelo === zoningFilter)
    .filter(p => energiaFilter === 'All' || p.tipo_energia === energiaFilter)
    .filter(p => !search ||
      p.colonia.toLowerCase().includes(search.toLowerCase()) ||
      (p.descripcion ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.calle ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'precio-asc')  return (a.precio_inmueble ?? 0) - (b.precio_inmueble ?? 0);
      if (sortBy === 'precio-desc') return (b.precio_inmueble ?? 0) - (a.precio_inmueble ?? 0);
      if (sortBy === 'm2-asc')  return a.m2 - b.m2;
      if (sortBy === 'm2-desc') return b.m2 - a.m2;
      return 0;
    });

  const inputStyle: React.CSSProperties = {
    background: '#12122a', border: '1px solid #2a2a4a', borderRadius: '10px',
    color: '#e0e0ff', padding: '10px 14px', fontSize: '14px',
    fontFamily: "'Inter', sans-serif", outline: 'none',
    transition: 'border-color 0.2s', width: '100%',
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
            {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'property found' : 'properties found'}`}
          </p>
        </div>

        {/* Filters */}
        <div style={{
          background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: '16px',
          padding: '20px 24px', marginBottom: '36px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {/* Row 1: search + sort */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: '6px' }}>SEARCH</label>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Neighborhood, street, description..."
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#00f5a0')}
                onBlur={e => (e.target.style.borderColor = '#2a2a4a')} />
            </div>
            <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: '6px' }}>SORT BY</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="precio-asc">Price: lowest first</option>
                <option value="precio-desc">Price: highest first</option>
                <option value="m2-asc">Size: smallest first</option>
                <option value="m2-desc">Size: largest first</option>
              </select>
            </div>
          </div>

          {/* Row 2: categorical filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: '6px' }}>LISTING TYPE</label>
              <select value={modalidadFilter} onChange={e => setModalidadFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="All">All</option>
                <option value="rent">For rent</option>
                <option value="sale">For sale</option>
              </select>
            </div>
            <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: '6px' }}>NEIGHBORHOOD</label>
              <select value={coloniaFilter} onChange={e => setColoniaFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {colonias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: '6px' }}>PROPERTY TYPE</label>
              <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {condiciones.length > 1 && (
              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: '6px' }}>CONDITION</label>
                <select value={condicionFilter} onChange={e => setCondicionFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {condiciones.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {zonings.length > 1 && (
              <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: '6px' }}>ZONING</label>
                <select value={zoningFilter} onChange={e => setZoningFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {zonings.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            )}
            {energias.length > 1 && (
              <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: '6px' }}>ELECTRICAL</label>
                <select value={energiaFilter} onChange={e => setEnergiaFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {energias.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}
            {hasActiveFilters && (
              <button onClick={() => { setSearch(''); setColoniaFilter('All'); setTipoFilter('All'); setModalidadFilter('All'); setCondicionFilter('All'); setZoningFilter('All'); setEnergiaFilter('All'); }}
                style={{ background: 'transparent', border: '1px solid #2a2a4a', borderRadius: '10px', color: '#6b6b9a', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.color = '#ff6b6b'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a4a'; e.currentTarget.style.color = '#6b6b9a'; }}>
                ✕ Clear all
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: '20px', height: '340px', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#6b6b9a' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#9090b8' }}>No results</p>
            <p style={{ fontSize: '15px' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {filtered.map(p => (
              <Link key={p.id} href={`/propiedades/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <article style={{
                background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: '20px',
                overflow: 'hidden', transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(0,245,160,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '#1e1e35'; }}
              >
                {/* Cover photo */}
                <div style={{ height: 180, background: '#0a0a18', position: 'relative', overflow: 'hidden' }}>
                  {p.photo_urls?.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo_urls[0]} alt={p.colonia} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.2 }}>
                      {TIPO_ICONS[p.tipo_local] ?? '🏬'}
                    </div>
                  )}
                  {p.photo_urls?.length > 1 && (
                    <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(4px)', borderRadius: 8, padding: '3px 8px', fontSize: 11, color: '#9090b8' }}>
                      +{p.photo_urls.length - 1} photos
                    </span>
                  )}
                  {p.modalidad && (
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: p.modalidad === 'rent' ? 'rgba(0,180,216,0.15)' : 'rgba(0,245,160,0.12)',
                      border: `1px solid ${p.modalidad === 'rent' ? 'rgba(0,180,216,0.4)' : 'rgba(0,245,160,0.3)'}`,
                      color: p.modalidad === 'rent' ? '#00b4d8' : '#00f5a0',
                      borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                    }}>
                      {p.modalidad === 'rent' ? 'For rent' : 'For sale'}
                    </span>
                  )}
                </div>

                <div style={{ padding: '20px 22px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#f0f0f8' }}>{p.colonia}</div>
                      {p.calle && <div style={{ fontSize: '12px', color: '#6b6b9a', marginTop: 2 }}>{p.calle} {p.numero}</div>}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.2)', color: '#00f5a0', padding: '4px 10px', borderRadius: '100px', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8 }}>
                      {p.m2} m²
                    </span>
                  </div>

                  <span style={{ fontSize: '12px', color: '#9090b8', background: '#12122a', border: '1px solid #2a2a4a', padding: '3px 10px', borderRadius: '8px', display: 'inline-block', marginBottom: '12px' }}>
                    {p.tipo_local}
                  </span>

                  {p.descripcion && (
                    <p style={{ color: '#8888aa', fontSize: '13px', lineHeight: 1.6, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.descripcion}
                    </p>
                  )}

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {p.banos > 0 && <span style={{ fontSize: '12px', color: '#9090b8' }}>🚿 {p.banos}</span>}
                    {p.habitaciones > 0 && <span style={{ fontSize: '12px', color: '#9090b8' }}>🚪 {p.habitaciones}</span>}
                    {p.estacionamientos > 0 && <span style={{ fontSize: '12px', color: '#9090b8' }}>🅿️ {p.estacionamientos}</span>}
                    {p.nivel_piso && <span style={{ fontSize: '12px', color: '#9090b8' }}>🏢 {p.nivel_piso}</span>}
                  </div>

                  <div style={{ height: 1, background: '#1e1e35', marginBottom: '14px' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6b6b9a', marginBottom: 2, fontWeight: 600, letterSpacing: '0.06em' }}>
                        {p.modalidad === 'rent' ? 'MONTHLY RENT' : 'PRICE'}
                      </div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: '#f0f0f8' }}>
                        {formatPrice(p.precio_inmueble, p.modalidad)}
                      </div>
                    </div>
                    <span style={{
                      background: 'linear-gradient(135deg, #00f5a0, #00b4d8)',
                      borderRadius: '10px', color: '#06060f',
                      fontWeight: 700, fontSize: '13px', padding: '10px 18px',
                      boxShadow: '0 4px 16px rgba(0,245,160,0.2)',
                    }}>
                      View details →
                    </span>
                  </div>
                </div>
              </article>
              </Link>
            ))}
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
