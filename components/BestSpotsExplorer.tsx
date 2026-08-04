'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import PropertiesListMap, { type MapPin } from './PropertiesListMap';
import { categoryLabel } from '@/lib/categoryLabels';

/** Giro ids from lib/giros.ts shown as quick chips (labels come from i18n). */
const CHIP_GIROS = [
  'restaurante',
  'cafeteria',
  'estetica',
  'tienda_ropa',
  'abarrotes',
  'gimnasio',
  'farmacia',
  'clinica',
] as const;

const SATURATION_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: '#15803d',
  medium: '#d97706',
  high: '#dc2626',
};

interface PreflightProperty {
  id: string;
  colonia: string;
  calle: string | null;
  numero: string | null;
  tipo_local: string;
  m2: number;
  precio_inmueble: number | null;
  lat: number | null;
  lng: number | null;
  distance_km: number | null;
  saturacion: {
    competidores_500m: number;
    competidores_2km: number;
    nivel: 'low' | 'medium' | 'high';
  };
}

interface PreflightResult {
  giro_detectado: { id: string | null; label: string; emoji: string };
  geo_aplicado: boolean;
  radio_km: number | null;
  properties_match: PreflightProperty[];
}

interface BestSpotsExplorerProps {
  initialPins: MapPin[];
}

export default function BestSpotsExplorer({ initialPins }: BestSpotsExplorerProps) {
  const t = useTranslations('BestSpots');
  const locale = useLocale();

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<'locating' | 'ok' | 'unavailable'>('locating');
  const [freeText, setFreeText] = useState('');
  const [active, setActive] = useState<{ giroId: string | null; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreflightResult | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoState('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('ok');
      },
      () => setGeoState('unavailable'),
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  const runSearch = useCallback(
    async (giroId: string | null, label: string, loc: { lat: number; lng: number } | null) => {
      const seq = ++requestSeq.current;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/buscar/preflight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            giro_id: giroId,
            descripcion: label,
            lat: loc?.lat ?? null,
            lng: loc?.lng ?? null,
            modalidad: 'any',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('errorGeneric'));
        if (seq !== requestSeq.current) return; // stale response
        setResult(data);
      } catch {
        if (seq !== requestSeq.current) return;
        setError(t('errorGeneric'));
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [t]
  );

  // Re-run the active search once geolocation resolves after the user already picked a giro.
  useEffect(() => {
    if (userLoc && active) runSearch(active.giroId, active.label, userLoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoc]);

  const selectGiro = (giroId: string) => {
    const label = t(`giro_${giroId}` as Parameters<typeof t>[0]);
    setActive({ giroId, label });
    setFreeText('');
    runSearch(giroId, label, userLoc);
  };

  const submitFreeText = () => {
    const text = freeText.trim();
    if (text.length < 3) return;
    setActive({ giroId: null, label: text });
    runSearch(null, text, userLoc);
  };

  const clearSearch = () => {
    requestSeq.current++;
    setActive(null);
    setResult(null);
    setError(null);
    setFreeText('');
    setLoading(false);
  };

  const matches = result?.properties_match ?? [];
  const resultPins: MapPin[] = matches
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: p.id,
      lat: p.lat!,
      lng: p.lng!,
      label: `${categoryLabel(p.tipo_local, locale)} · ${p.colonia}`,
      color: SATURATION_COLORS[p.saturacion.nivel],
      sublabel:
        p.saturacion.nivel === 'low'
          ? t('legendLow')
          : p.saturacion.nivel === 'medium'
            ? t('legendMedium')
            : t('legendHigh'),
      href: `/${locale}/propiedades/${p.id}`,
    }));

  const pins = active && result ? resultPins : initialPins;

  const chipStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? 'linear-gradient(135deg, #0f1b3d, #3b6fa0)' : '#ffffff',
    color: isActive ? '#ffffff' : '#5a6288',
    border: isActive ? '1px solid transparent' : '1px solid #d5daea',
    borderRadius: 100,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  });

  const legendItems: { nivel: 'low' | 'medium' | 'high'; label: string }[] = [
    { nivel: 'low', label: t('legendLow') },
    { nivel: 'medium', label: t('legendMedium') },
    { nivel: 'high', label: t('legendHigh') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── "Best spots for:" bar ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #d5daea',
          borderRadius: 16,
          padding: '16px 18px',
          boxShadow: '0 2px 12px rgba(15,27,61,0.06)',
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 800, color: '#181e38', margin: '0 0 10px' }}>
          {t('title')}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {CHIP_GIROS.map((id) => (
            <button
              key={id}
              onClick={() => selectGiro(id)}
              style={chipStyle(active?.giroId === id)}
            >
              {t(`giro_${id}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitFreeText();
            }}
            placeholder={t('inputPlaceholder')}
            style={{
              flex: 1,
              minWidth: 0,
              background: '#edf0f8',
              border: '1px solid #d5daea',
              borderRadius: 10,
              padding: '9px 12px',
              fontSize: 13,
              color: '#181e38',
              outline: 'none',
            }}
          />
          <button
            onClick={submitFreeText}
            disabled={freeText.trim().length < 3}
            style={{
              background: 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: freeText.trim().length < 3 ? 'default' : 'pointer',
              opacity: freeText.trim().length < 3 ? 0.5 : 1,
            }}
          >
            {t('searchBtn')}
          </button>
        </div>

        {/* Geo / search status */}
        <p style={{ fontSize: 11, color: '#9099b8', margin: '10px 0 0' }}>
          {loading
            ? t('loading')
            : geoState === 'locating'
              ? t('locating')
              : geoState === 'ok' && active && result?.geo_aplicado
                ? t('nearYou', { km: result.radio_km ?? 2 })
                : geoState === 'unavailable'
                  ? t('noGeo')
                  : null}
        </p>

        {error && (
          <p style={{ fontSize: 12, color: '#dc2626', margin: '8px 0 0' }}>⚠ {error}</p>
        )}
      </div>

      {/* ── Map ── */}
      <PropertiesListMap
        pins={pins}
        userLocation={userLoc}
        userLocationLabel={t('youAreHere')}
        height={active && result ? 420 : 480}
      />

      {/* ── Results ── */}
      {active && result && !loading && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #d5daea',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 2px 12px rgba(15,27,61,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#181e38' }}>
              {result.giro_detectado.emoji}{' '}
              {t('resultsCount', { count: matches.length, giro: active.label })}
            </span>
            <button
              onClick={clearSearch}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9099b8',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t('clear')}
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: matches.length > 0 ? 12 : 0 }}>
            {legendItems.map((item) => (
              <span
                key={item.nivel}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5a6288' }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: SATURATION_COLORS[item.nivel],
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 0 1px #d5daea',
                  }}
                />
                {item.label}
              </span>
            ))}
          </div>

          {matches.length === 0 ? (
            <p style={{ fontSize: 12, color: '#5a6288', margin: '10px 0 0' }}>{t('noResults')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {matches.slice(0, 5).map((p) => (
                <a
                  key={p.id}
                  href={`/${locale}/propiedades/${p.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    border: '1px solid #e4e7f4',
                    borderRadius: 10,
                    textDecoration: 'none',
                    background: '#fafbfe',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#181e38',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.colonia}
                    </p>
                    <p style={{ fontSize: 11, color: '#5a6288', margin: '2px 0 0' }}>
                      {categoryLabel(p.tipo_local, locale)} · {p.m2} m²
                      {p.distance_km != null && ` · ${p.distance_km.toFixed(1)} km`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: SATURATION_COLORS[p.saturacion.nivel],
                        marginBottom: 4,
                      }}
                    />
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#181e38', margin: 0 }}>
                      {p.precio_inmueble ? `$${p.precio_inmueble.toLocaleString('en-US')}` : '—'}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
