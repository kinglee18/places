'use client';

import Link from 'next/link';

const TIPO_ICONS: Record<string, string> = {
  'Street-facing (with storefront)': '🪟',
  'Inside commercial plaza': '🏬',
  'Corner unit': '🔀',
  'Basement / Semi-basement': '⬇️',
  'Market stall': '🛒',
};

const SHORT_TIPO: Record<string, string> = {
  'Street-facing (with storefront)': 'Storefront',
  'Inside commercial plaza': 'Plaza unit',
  'Corner unit': 'Corner unit',
  'Basement / Semi-basement': 'Basement space',
  'Market stall': 'Market stall',
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
  precio_mantenimiento: number | null;
  descripcion: string | null;
  photo_urls: string[];
  nivel_piso: string | null;
  city: string | null;
  state: string | null;
  estado_conservacion?: string | null;
}

export default function PropertyCard(p: PropertyCardProps) {
  const shortType = SHORT_TIPO[p.tipo_local] ?? p.tipo_local;
  const title = `${shortType} in ${p.colonia}`;

  const addressParts = [
    p.calle ? `${p.calle}${p.numero ? ` ${p.numero}` : ''}` : null,
    p.city ?? p.colonia,
  ].filter(Boolean);
  const address = addressParts.join(', ');

  const displayPrice = p.modalidad === 'rent'
    ? (p.precio_mantenimiento ?? p.precio_inmueble)
    : p.precio_inmueble;

  return (
    <Link href={`/propiedades/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <article
        style={{
          display: 'flex',
          background: '#ffffff',
          border: '1px solid #e4e7f4',
          borderRadius: 16,
          overflow: 'hidden',
          transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(15,27,61,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'oklch(0.72 0.06 250)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.transform = '';
          e.currentTarget.style.borderColor = '#e4e7f4';
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: 190,
            minWidth: 190,
            background: '#edf0f8',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            alignSelf: 'stretch',
          }}
        >
          {p.photo_urls?.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photo_urls[0]}
              alt={p.colonia}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                minHeight: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 38,
                opacity: 0.22,
              }}
            >
              {TIPO_ICONS[p.tipo_local] ?? '🏬'}
            </div>
          )}
          {p.photo_urls?.length > 1 && (
            <span
              style={{
                position: 'absolute', bottom: 8, right: 8,
                background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(4px)',
                borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#5a6288', fontWeight: 600,
              }}
            >
              +{p.photo_urls.length - 1} photos
            </span>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            minWidth: 0,
            justifyContent: 'center',
          }}
        >
          {/* Row 1: title + modality badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: '#181e38',
                lineHeight: 1.35,
                flex: 1,
                minWidth: 0,
              }}
            >
              {title}
            </span>
            {p.modalidad && (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  background:
                    p.modalidad === 'rent'
                      ? 'oklch(0.94 0.04 240)'
                      : 'oklch(0.94 0.03 250)',
                  color:
                    p.modalidad === 'rent'
                      ? 'oklch(0.42 0.12 240)'
                      : 'oklch(0.38 0.10 250)',
                  border: `1px solid ${
                    p.modalidad === 'rent'
                      ? 'oklch(0.82 0.08 240)'
                      : 'oklch(0.82 0.06 250)'
                  }`,
                  borderRadius: 6,
                  padding: '4px 9px',
                }}
              >
                {p.modalidad === 'rent' ? 'For rent' : 'For sale'}
              </span>
            )}
          </div>

          {/* Row 2: address */}
          <p style={{ fontSize: 12, color: '#9099b8', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
            <span style={{ fontSize: 11 }}>📍</span>
            {address}
          </p>

          {/* Row 3: stats */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#5a6288', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>📐</span> {p.m2} m²
            </span>
            {displayPrice && (
              <span style={{ fontSize: 12, color: '#5a6288', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>💰</span> {formatPrice(displayPrice, p.modalidad)}
              </span>
            )}
            {p.banos > 0 && (
              <span style={{ fontSize: 12, color: '#9099b8' }}>🚿 {p.banos}</span>
            )}
            {p.habitaciones > 0 && (
              <span style={{ fontSize: 12, color: '#9099b8' }}>🚪 {p.habitaciones}</span>
            )}
            {p.estacionamientos > 0 && (
              <span style={{ fontSize: 12, color: '#9099b8' }}>🅿️ {p.estacionamientos}</span>
            )}
            {p.nivel_piso && (
              <span style={{ fontSize: 12, color: '#9099b8' }}>🏢 {p.nivel_piso}</span>
            )}
          </div>

          {/* Row 4: description */}
          {p.descripcion ? (
            <p
              style={{
                fontSize: 12,
                color: '#5a6288',
                lineHeight: 1.55,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {p.descripcion}
            </p>
          ) : (
            <p style={{ fontSize: 12, color: '#b0b8d4', fontStyle: 'italic', margin: 0 }}>
              No description added yet.
            </p>
          )}
        </div>

        {/* Right arrow — subtle CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px',
            color: '#9099b8',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          →
        </div>
      </article>
    </Link>
  );
}
