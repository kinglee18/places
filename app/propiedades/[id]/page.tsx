'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import NavHeader from '@/components/NavHeader';

interface CompetitionEntry {
  name: string;
  category: string | null;
  vicinity: string;
  rating: number | null;
}

interface CompetitionData {
  within_500m:     Record<string, number>;
  within_2km:      Record<string, number>;
  top_nearby:      CompetitionEntry[];
  opportunities:   Array<{ category: string; count_500m: number; count_2km: number; score: 'high' | 'medium' }>;
  saturated:       Array<{ category: string; count_500m: number }>;
  tourist_context: {
    zone_type: 'cultural' | 'religious' | 'entertainment' | 'nature' | 'lodging' | 'mixed';
    attraction_count: number;
    nearby_attractions: Array<{ name: string; type: string }>;
    suggestions: Array<{ category: string; reason: string }>;
  } | null;
}

interface Property {
  id: string;
  created_at: string;
  user_email: string;
  colonia: string;
  city:    string | null;
  state:   string | null;
  country: string | null;
  calle: string | null;
  numero: string | null;
  descripcion: string | null;
  tipo_local: string;
  m2: number;
  antiguedad: number | null;
  nivel_piso: string | null;
  uso_anterior: string | null;
  agua_drenaje: string | null;
  habitaciones: number;
  banos: number;
  estacionamientos: number;
  modalidad: string | null;
  precio_inmueble: number | null;
  precio_mantenimiento: number | null;
  lat: number | null;
  lng: number | null;
  photo_urls: string[];
  competition_data: CompetitionData | null;
  m2_construccion: number | null;
  frente_m: number | null;
  fondo_m: number | null;
  altura_techo_m: number | null;
  tipo_terreno: string | null;
  estado_conservacion: string | null;
  calidad_construccion: string | null;
  tipo_energia: string | null;
  uso_suelo: string | null;
  servicios: string[] | null;
}

function formatPrice(val: number | null): string {
  if (!val) return '—';
  return `$${val.toLocaleString('en-US')} MXN`;
}

const TIPO_ICONS: Record<string, string> = {
  'Street-facing (with storefront)': '🪟',
  'Inside commercial plaza': '🏬',
  'Corner unit': '🔀',
  'Basement / Semi-basement': '⬇️',
  'Market stall': '🛒',
};

const stat = (icon: string, label: string, value: string | number | null) =>
  value ? { icon, label, value: String(value) } : null;

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  type Analysis = {
    nivel_competencia: 'low' | 'medium' | 'high';
    oportunidad: string;
    usos_recomendados: { uso: string; razon: string }[];
    advertencia: string | null;
  };
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [runningZone, setRunningZone] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      });
      let json: { analysis?: Analysis; error?: string } = {};
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server error (${res.status}) — check ANTHROPIC_API_KEY`);
      }
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
      if (!json.analysis) throw new Error('No analysis returned');
      setAnalysis(json.analysis);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'Unknown error');
    }
    setAnalyzing(false);
  };

  const handleAnalyzeZone = async () => {
    if (!property?.lat || !property?.lng) return;
    setRunningZone(true);
    setZoneError(null);
    try {
      const nearbyRes = await fetch('/api/nearby-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: property.lat, lng: property.lng, tipoLocal: property.tipo_local }),
      });
      if (!nearbyRes.ok) throw new Error('Error fetching zone data');
      const competition_data = await nearbyRes.json();

      const saveRes = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competition_data }),
      });
      if (!saveRes.ok) throw new Error('Error saving the analysis');

      setProperty(prev => prev ? { ...prev, competition_data } : prev);
    } catch (e) {
      setZoneError(e instanceof Error ? e.message : 'Unknown error');
    }
    setRunningZone(false);
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/properties/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) setNotFound(true);
        else setProperty(data as Property);
        setLoading(false);
      });
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#06060f', color: '#f0f0f8', fontFamily: "'Inter', sans-serif" }}>
        <NavHeader />
        <div style={{ maxWidth: 900, margin: '80px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[320, 80, 160, 120].map((h, i) => (
            <div key={i} style={{ height: h, background: '#0d0d1a', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </main>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !property) {
    return (
      <main style={{ minHeight: '100vh', background: '#06060f', color: '#f0f0f8', fontFamily: "'Inter', sans-serif" }}>
        <NavHeader />
        <div style={{ maxWidth: 600, margin: '120px auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Property not found</h1>
          <p style={{ color: '#6b6b9a', marginBottom: 32 }}>This property may have been removed or the link is invalid.</p>
          <Link href="/propiedades" style={{
            background: 'linear-gradient(135deg, #00f5a0, #00b4d8)', color: '#06060f',
            padding: '12px 28px', borderRadius: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            ← Back to properties
          </Link>
        </div>
      </main>
    );
  }

  const p = property;
  const photos = p.photo_urls?.length > 0 ? p.photo_urls : null;

  const stats = [
    stat('📐', 'Land area', `${p.m2} m²`),
    stat('🏗️', 'Built area', p.m2_construccion ? `${p.m2_construccion} m²` : null),
    stat('↔️', 'Frontage', p.frente_m ? `${p.frente_m} m` : null),
    stat('↕️', 'Depth', p.fondo_m ? `${p.fondo_m} m` : null),
    stat('⬆️', 'Ceiling height', p.altura_techo_m ? `${p.altura_techo_m} m` : null),
    stat('🏢', 'Floor', p.nivel_piso),
    stat('📅', 'Age', p.antiguedad ? `${p.antiguedad} years` : null),
    stat('🔲', 'Lot type', p.tipo_terreno),
    stat('🔧', 'Condition', p.estado_conservacion),
    stat('🏆', 'Build quality', p.calidad_construccion),
    stat('⚡', 'Electrical', p.tipo_energia),
    stat('🗺️', 'Zoning', p.uso_suelo),
    stat('💧', 'Water / Drainage', p.agua_drenaje),
    stat('🚿', 'Bathrooms', p.banos || null),
    stat('🚪', 'Rooms', p.habitaciones || null),
    stat('🅿️', 'Parking', p.estacionamientos || null),
    stat('🔄', 'Last use', p.uso_anterior),
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  const competition = p.competition_data;
  const isOwner = session?.user?.email === p.user_email;
  const mapsUrl = p.lat && p.lng
    ? `https://www.google.com/maps?q=${p.lat},${p.lng}`
    : p.calle
    ? `https://www.google.com/maps/search/${encodeURIComponent([p.numero, p.calle, p.colonia, 'CDMX'].filter(Boolean).join(', '))}`
    : null;

  return (
    <main style={{ minHeight: '100vh', background: '#06060f', color: '#f0f0f8', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Back */}
        <Link href="/propiedades" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#6b6b9a', textDecoration: 'none', marginBottom: 32, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00f5a0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9a')}>
          ← All properties
        </Link>

        {/* ── Photo gallery ── */}
        {photos ? (
          <div style={{ marginBottom: 36 }}>
            {/* Main photo */}
            <div style={{ borderRadius: 16, overflow: 'hidden', height: 420, background: '#0a0a18', marginBottom: 10, position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[activePhoto]} alt={`Photo ${activePhoto + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }} />
              <span style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(6,6,15,0.75)', backdropFilter: 'blur(6px)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#9090b8' }}>
                {activePhoto + 1} / {photos.length}
              </span>
            </div>
            {/* Thumbnails */}
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {photos.map((src, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)} style={{
                    flexShrink: 0, width: 80, height: 60, borderRadius: 8, overflow: 'hidden',
                    border: i === activePhoto ? '2px solid #00f5a0' : '2px solid transparent',
                    padding: 0, cursor: 'pointer', transition: 'border-color 0.15s', background: 'none',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`thumb-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: 220, borderRadius: 16, background: '#0d0d1a', border: '1px solid #1e1e35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 36, opacity: 0.3 }}>
            {TIPO_ICONS[p.tipo_local] ?? '🏬'}
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#00f5a0', textTransform: 'uppercase' }}>
                {p.colonia}
              </span>
              {(p.city || p.state || p.country) && (
                <span style={{ fontSize: 11, color: '#6b6b9a', fontFamily: "'DM Mono', monospace" }}>
                  {[p.city, p.state, p.country].filter(Boolean).join(', ')}
                </span>
              )}
              {p.modalidad && (
                <span style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 100,
                  padding: '3px 10px',
                  background: p.modalidad === 'rent' ? 'rgba(0,180,216,0.12)' : 'rgba(0,245,160,0.08)',
                  border: `1px solid ${p.modalidad === 'rent' ? 'rgba(0,180,216,0.4)' : 'rgba(0,245,160,0.3)'}`,
                  color: p.modalidad === 'rent' ? '#00b4d8' : '#00f5a0',
                }}>
                  {p.modalidad === 'rent' ? 'For rent' : 'For sale'}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 6, letterSpacing: '-0.02em' }}>
              {p.tipo_local}{p.calle ? ` · ${p.calle}${p.numero ? ` ${p.numero}` : ''}` : ''}
            </h1>
            <p style={{ color: '#6b6b9a', fontSize: 14 }}>
              Published {new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Price block */}
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: 16, padding: '20px 24px', minWidth: 200, textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#6b6b9a', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>
              {p.modalidad === 'rent' ? 'MONTHLY RENT' : p.modalidad === 'sale' ? 'SALE PRICE' : 'PRICE'}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f0f0f8', letterSpacing: '-0.01em' }}>
              {formatPrice(p.precio_inmueble)}
            </div>
            {p.precio_mantenimiento && (
              <div style={{ fontSize: 12, color: '#6b6b9a', marginTop: 4 }}>
                Maintenance: {formatPrice(p.precio_mantenimiento)}/mo
              </div>
            )}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20, marginBottom: 24 }}>

          {/* Stats */}
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: 16, padding: '24px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#6b6b9a', marginBottom: 18, textTransform: 'uppercase' }}>Property details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 11, color: '#6b6b9a', marginBottom: 3 }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f8' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Services */}
            {p.servicios && p.servicios.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e1e35' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: 10, textTransform: 'uppercase' }}>Additional services</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.servicios.map(s => (
                    <span key={s} style={{
                      fontSize: 11, fontFamily: "'DM Mono', monospace",
                      padding: '4px 10px', borderRadius: 7,
                      background: 'rgba(0,245,160,0.07)', border: '1px solid rgba(0,245,160,0.22)',
                      color: '#00f5a0',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Map link */}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20,
                fontSize: 13, fontWeight: 600, color: '#00b4d8', textDecoration: 'none',
                border: '1px solid rgba(0,180,216,0.3)', borderRadius: 8, padding: '8px 14px',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,180,216,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                🗺️ View on Google Maps
              </a>
            )}
          </div>

          {/* Competition & Opportunities */}
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: 16, padding: '24px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#6b6b9a', marginBottom: 18, textTransform: 'uppercase' }}>Zone analysis</p>

            {!competition ? (
              <div style={{ color: '#6b6b9a', fontSize: 13, lineHeight: 1.6 }}>
                {isOwner && p.lat && p.lng ? (
                  <div>
                    <p style={{ marginBottom: 14 }}>This listing does not have zone analysis yet.</p>
                    {zoneError && (
                      <p style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>{zoneError}</p>
                    )}
                    <button
                      onClick={handleAnalyzeZone}
                      disabled={runningZone}
                      style={{
                        background: runningZone ? 'rgba(0,245,160,0.08)' : 'linear-gradient(135deg, #00f5a0, #00b4d8)',
                        color: runningZone ? '#00f5a0' : '#0a0a14',
                        border: runningZone ? '1px solid rgba(0,245,160,0.3)' : 'none',
                        borderRadius: 8, padding: '10px 20px',
                        fontWeight: 700, fontSize: 13, cursor: runningZone ? 'not-allowed' : 'pointer',
                        fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {runningZone ? '⏳ Analyzing zone...' : '📍 Analyze zone now'}
                    </button>
                  </div>
                ) : (
                  <>
                    <p>No zone data available.</p>
                    <p style={{ marginTop: 8 }}>Analysis requires a map pin or address.</p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Tourist context */}
                {competition.tourist_context && (() => {
                  const tc = competition.tourist_context!;
                  const zoneLabels: Record<string, string> = {
                    cultural: 'Cultural / Historic',
                    religious: 'Religious',
                    entertainment: 'Entertainment',
                    nature: 'Nature',
                    lodging: 'Hotel / Lodging',
                    mixed: 'Mixed tourist',
                  };
                  return (
                    <div style={{ marginBottom: 20, padding: '16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#fbbf24', marginBottom: 12, textTransform: 'uppercase' }}>
                        🗺️ Tourist zone — {zoneLabels[tc.zone_type]}
                      </p>

                      {/* Nearby attractions */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        {tc.nearby_attractions.map((a, i) => (
                          <span key={i} style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", padding: '3px 9px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fde68a' }}>
                            {a.name} · {a.type}
                          </span>
                        ))}
                      </div>

                      {/* Business suggestions */}
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#fbbf24', marginBottom: 8, textTransform: 'uppercase' }}>
                        Recommended businesses for this area
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {tc.suggestions.map((s, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#fde68a' }}>{s.category}</span>
                            <span style={{ fontSize: 12, color: '#a0906a', lineHeight: 1.5 }}>{s.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Opportunities */}
                {competition.opportunities?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#00f5a0', marginBottom: 10, textTransform: 'uppercase' }}>
                      💡 Opportunities in this area
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {competition.opportunities.map((o) => (
                        <div key={o.category} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: 8,
                          background: o.score === 'high' ? 'rgba(0,245,160,0.07)' : 'rgba(0,245,160,0.03)',
                          border: `1px solid ${o.score === 'high' ? 'rgba(0,245,160,0.25)' : 'rgba(0,245,160,0.1)'}`,
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0ff' }}>{o.category}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, color: '#6b6b9a', fontFamily: "'DM Mono', monospace" }}>
                              {o.count_500m} within 500m · {o.count_2km} within 2km
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                              background: o.score === 'high' ? 'rgba(0,245,160,0.15)' : 'rgba(0,245,160,0.07)',
                              color: '#00f5a0', fontFamily: "'DM Mono', monospace", letterSpacing: '0.05em',
                            }}>
                              {o.score === 'high' ? 'HIGH' : 'MEDIUM'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saturated */}
                {competition.saturated?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#ff6b6b', marginBottom: 10, textTransform: 'uppercase' }}>
                      ⚠️ Saturated categories — high competition
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {competition.saturated.map((s) => (
                        <span key={s.category} style={{
                          fontSize: 11, fontFamily: "'DM Mono', monospace",
                          padding: '4px 10px', borderRadius: 7,
                          background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.22)',
                          color: '#ff6b6b',
                        }}>
                          {s.category} · {s.count_500m} within 500m
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div style={{ borderTop: '1px solid #1e1e35', marginBottom: 16 }} />

                {/* Top nearby list */}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', marginBottom: 10, textTransform: 'uppercase' }}>
                  Nearest businesses
                </p>
                {competition.top_nearby.filter(b => b.category).slice(0, 5).map((b, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid #1e1e35',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: '#6b6b9a' }}>{b.category}</div>
                    </div>
                    {b.rating && (
                      <span style={{ fontSize: 12, color: '#fbbf24', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>★ {b.rating}</span>
                    )}
                  </div>
                ))}
                {competition.top_nearby.filter(b => b.category).length === 0 && (
                  <p style={{ fontSize: 12, color: '#6b6b9a' }}>No businesses registered within 500m.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        {p.descripcion && (
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#6b6b9a', marginBottom: 14, textTransform: 'uppercase' }}>Description</p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: '#c8c8e8' }}>{p.descripcion}</p>
          </div>
        )}

        {/* ── AI Analysis ── */}
        {session?.user && (
          <div style={{ background: '#0d0d1a', border: '1px solid #1e1e35', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#6b6b9a', marginBottom: 4, textTransform: 'uppercase' }}>AI Analysis</p>
                <p style={{ fontSize: 13, color: '#9090b8' }}>Business recommendations generated by Claude</p>
              </div>
              {!analysis && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  style={{
                    background: analyzing ? 'rgba(0,245,160,0.08)' : 'linear-gradient(135deg, #00f5a0, #00b4d8)',
                    color: analyzing ? '#00f5a0' : '#06060f',
                    border: analyzing ? '1px solid rgba(0,245,160,0.3)' : 'none',
                    padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
                    cursor: analyzing ? 'default' : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'opacity 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {analyzing ? (
                    <>
                      <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #00f5a0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Analyzing...
                    </>
                  ) : '✦ Analyze with AI'}
                </button>
              )}
            </div>

            {analyzeError && (
              <p style={{ fontSize: 13, color: '#ff6b6b', fontFamily: "'DM Mono', monospace" }}>{analyzeError}</p>
            )}

            {analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Level + opportunity */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100,
                    background: analysis.nivel_competencia === 'high' ? 'rgba(255,107,107,0.1)' : analysis.nivel_competencia === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(0,245,160,0.1)',
                    border: `1px solid ${analysis.nivel_competencia === 'high' ? 'rgba(255,107,107,0.4)' : analysis.nivel_competencia === 'medium' ? 'rgba(251,191,36,0.4)' : 'rgba(0,245,160,0.4)'}`,
                    color: analysis.nivel_competencia === 'high' ? '#ff6b6b' : analysis.nivel_competencia === 'medium' ? '#fbbf24' : '#00f5a0',
                  }}>
                    {analysis.nivel_competencia === 'high' ? 'High competition' : analysis.nivel_competencia === 'medium' ? 'Medium competition' : 'Low competition'}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#c8c8e8', lineHeight: 1.6 }}>{analysis.oportunidad}</p>

                {/* Recommended uses */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#6b6b9a', textTransform: 'uppercase' }}>Recommended uses</p>
                  {analysis.usos_recomendados.map((item, i) => (
                    <div key={i} style={{ background: '#12122a', border: '1px solid #1e1e35', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#00f5a0', marginBottom: 4 }}>{item.uso}</div>
                      <div style={{ fontSize: 12, color: '#9090b8', lineHeight: 1.5 }}>{item.razon}</div>
                    </div>
                  ))}
                </div>

                {/* Warning */}
                {analysis.advertencia && (
                  <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 12, color: '#fbbf24', lineHeight: 1.5 }}>⚠ {analysis.advertencia}</p>
                  </div>
                )}

                <button onClick={() => setAnalysis(null)} style={{ alignSelf: 'flex-start', background: 'none', border: '1px solid #1e1e35', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#6b6b9a', cursor: 'pointer', fontFamily: "'Inter', sans-serif', transition: 'border-color 0.15s'" }}>
                  Regenerate analysis
                </button>
              </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Bottom CTAs ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/registro" style={{
            background: 'linear-gradient(135deg, #00f5a0, #00b4d8)', color: '#06060f',
            padding: '13px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14,
            textDecoration: 'none', boxShadow: '0 6px 24px rgba(0,245,160,0.25)',
          }}>
            Register a similar property →
          </Link>
          <Link href="/propiedades" style={{
            background: 'transparent', color: '#9090b8',
            padding: '13px 28px', borderRadius: 12, fontWeight: 600, fontSize: 14,
            textDecoration: 'none', border: '1px solid #1e1e35',
            transition: 'border-color 0.2s, color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2a4a'; e.currentTarget.style.color = '#f0f0f8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e35'; e.currentTarget.style.color = '#9090b8'; }}
          >
            ← Back to all properties
          </Link>
        </div>

      </div>
    </main>
  );
}
