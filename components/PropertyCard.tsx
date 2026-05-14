'use client';

import Link from 'next/link';

const TIPO_ICONS: Record<string, string> = {
  'Street-facing (with storefront)': '🪟',
  'Inside commercial plaza': '🏬',
  'Corner unit': '🔀',
  'Basement / Semi-basement': '⬇️',
  'Market stall': '🛒',
};

function formatPrice(val: number | null, modalidad?: string | null): string {
  if (!val) return '—';
  return `$${val.toLocaleString('en-US')} MXN${modalidad === 'rent' ? '/mo' : ''}`;
}

export interface PropertyCardProps {
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
  descripcion: string | null;
  photo_urls: string[];
  nivel_piso: string | null;
  city: string | null;
  state: string | null;
}

export default function PropertyCard(p: PropertyCardProps) {
  return (
    <Link href={`/propiedades/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <article
        style={{
          background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: '20px',
          overflow: 'hidden', transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
          cursor: 'pointer', height: '100%',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
          e.currentTarget.style.borderColor = 'rgba(0,245,160,0.25)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = '#1e1e35';
        }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#f0f0f8' }}>{p.colonia}</div>
              <div style={{ fontSize: '12px', color: '#6b6b9a', marginTop: 2 }}>
                {[p.calle && `${p.calle}${p.numero ? ` ${p.numero}` : ''}`, p.city, p.state].filter(Boolean).join(' · ')}
              </div>
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
  );
}
