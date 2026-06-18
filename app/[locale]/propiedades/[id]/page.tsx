'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import NavHeader from '@/components/NavHeader';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 300, borderRadius: 12, background: '#edf0f8', border: '1px solid #d5daea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#9099b8', fontSize: 13 }}>Loading map...</span>
    </div>
  ),
});

interface IsochroneFeature {
  type: 'Feature';
  properties: { value: number };
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

interface CompetitionEntry {
  name: string;
  category: string | null;
  vicinity: string;
  rating: number | null;
}

interface AiAnalysis {
  nivel_competencia: 'low' | 'medium' | 'high';
  oportunidad: string;
  usos_recomendados: { uso: string; razon: string }[];
  advertencia: string | null;
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
  ai_analysis?: AiAnalysis;
  nearby_transit?: Array<{
    name: string;
    type: string;
    icon: string;
    distance_m: number | null;
  }>;
  food_subcategories?: {
    present_500m: string[];
    present_5km: string[];
    gaps: string[];
  };
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
  tipo_contrato: string | null;
  fecha_disponible: string | null;
  precio_inmueble: number | null;
  precio_mantenimiento: number | null;
  lat: number | null;
  lng: number | null;
  photo_urls: string[];
  expires_at: string | null;
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
  usos_permitidos: string[] | null;
  usos_no_preferidos: string[] | null;
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

// ── shared light-theme tokens ──────────────────────────────────────────────
const BG      = 'oklch(0.985 0.005 240)';
const CARD    = '#ffffff';
const CARD2   = '#f5f6fc';
const BORDER  = '#d5daea';
const TEXT    = '#181e38';
const MUTED   = '#5a6288';
const SUBTLE  = '#9099b8';
const ACCENT  = '#3b6fa0';
const ACCENT2 = '#0f1b3d';

export default function PropertyDetailPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const { data: session } = useSession();
  const tP = useTranslations('PropertyDetail');
  const tL = useTranslations('LocalIQ');

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [nowTs] = useState<number>(() => Date.now());

  const [isochrones, setIsochrones] = useState<IsochroneFeature[]>([]);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [runningZone, setRunningZone] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);

  type RentalEstimate = {
    estimated_min: number;
    estimated_max: number;
    price_per_m2: number;
    confidence: 'high' | 'medium' | 'low';
    summary: string;
  };
  const [rental, setRental] = useState<RentalEstimate | null>(null);
  const [loadingRental, setLoadingRental] = useState(false);
  const [rentalError, setRentalError] = useState<string | null>(null);

  const [extending, setExtending] = useState(false);

  // ── Inquiries ──────────────────────────────────────────────────────────────
  type Inquiry = {
    id: string;
    sender_name: string | null;
    sender_email: string | null;
    questions: string[];
    message: string | null;
    is_read: boolean;
    created_at: string;
  };

  const PRESET_QUESTIONS = [
    tP('presetQ1'),
    tP('presetQ2'),
    tP('presetQ3'),
    tP('presetQ4'),
    tP('presetQ5'),
    tP('presetQ6'),
  ];

  const [inqSelected, setInqSelected]   = useState<string[]>([]);
  const [inqMessage, setInqMessage]     = useState('');
  const [inqName, setInqName]           = useState('');
  const [inqEmail, setInqEmail]         = useState('');
  const [inqSending, setInqSending]     = useState(false);
  const [inqSent, setInqSent]           = useState(false);
  const [inqError, setInqError]         = useState<string | null>(null);
  const [inquiries, setInquiries]       = useState<Inquiry[]>([]);
  const [loadingInq, setLoadingInq]     = useState(false);
  const [inboxOpen, setInboxOpen]       = useState(false);

  // ── DB value → translated label lookup functions ────────────────────────────
  const tipoLabel = (v: string): string => ({
    'Street-facing (with storefront)': tL('tipoStreetFacing'),
    'Inside commercial plaza': tL('tipoInsidePlaza'),
    'Corner unit': tL('tipoCornerUnit'),
    'Basement / Semi-basement': tL('tipoBasement'),
    'Market stall': tL('tipoMarketStall'),
  }[v] ?? v);

  const nivelLabel = (v: string): string => ({
    'Ground floor (street level)': tL('nivelGroundFloor'),
    'Mezzanine': tL('nivelMezzanine'),
    '2nd floor': tL('nivel2ndFloor'),
    '3rd floor or above': tL('nivel3rdPlus'),
    'Basement / semi-basement': tL('nivelBasement'),
  }[v] ?? v);

  const usoAnteriorLabel = (v: string): string => ({
    'Restaurant / food service': tL('usoRestaurant'),
    'Retail / store': tL('usoRetail'),
    'Office': tL('usoOffice'),
    'Gym / wellness': tL('usoGym'),
    'Beauty / salon': tL('usoBeauty'),
    'Medical / clinic': tL('usoMedical'),
    'Warehouse': tL('usoWarehouse'),
    'Vacant (never used)': tL('usoVacant'),
    'Other': tL('usoOther'),
  }[v] ?? v);

  const terrenoLabel = (v: string): string => ({
    'Regular': tL('terrenoRegular'),
    'Irregular': tL('terrenoIrregular'),
    'Corner lot': tL('terrenoCornerLot'),
  }[v] ?? v);

  const conservacionLabel = (v: string): string => ({
    'New': tL('conservNew'),
    'Excellent': tL('conservExcellent'),
    'Good': tL('conservGood'),
    'Fair': tL('conservFair'),
    'Needs renovation': tL('conservRenovation'),
  }[v] ?? v);

  const calidadLabel = (v: string): string => ({
    'High': tL('calidadHigh'),
    'Medium': tL('calidadMedium'),
    'Low': tL('calidadLow'),
  }[v] ?? v);

  const energiaLabel = (v: string): string => ({
    'Single-phase': tL('energiaSingle'),
    'Three-phase': tL('energiaThree'),
    'Not specified': tL('energiaNotSpecified'),
  }[v] ?? v);

  const sueloLabel = (v: string): string => ({
    'Commercial': tL('usoSueloCommercial'),
    'Industrial': tL('usoSueloIndustrial'),
    'Mixed-use': tL('usoSueloMixed'),
    'Residential with commercial': tL('usoSueloResidential'),
    'Not specified': tL('usoSueloNotSpecified'),
  }[v] ?? v);

  const aguaLabel = (v: string): string => ({
    'Water and drainage complete': tL('waterComplete'),
    'Water only': tL('waterOnly'),
    'Drainage only': tL('drainageOnly'),
    'No connections': tL('noConnections'),
  }[v] ?? v);

  const servicioLabel = (v: string): string => ({
    'Electricity': tL('servicioElectricity'),
    'Exterior lighting': tL('servicioLighting'),
    'Reception': tL('servicioReception'),
    'Good access': tL('servicioAccess'),
  }[v] ?? v);

  const bizLabel = (v: string): string => ({
    'Restaurant / food service': tL('bizRestaurant'),
    'Café / coffee shop': tL('bizCafe'),
    'Bar / nightlife': tL('bizBar'),
    'Retail / boutique': tL('bizRetail'),
    'Pharmacy / drugstore': tL('bizPharmacy'),
    'Barbershop / hair salon': tL('bizBarbershop'),
    'Gym / fitness center': tL('bizGym'),
    'Office / coworking': tL('bizOffice'),
    'Medical / clinic': tL('bizMedical'),
    'Education / tutoring': tL('bizEducation'),
    'Convenience store': tL('bizConvenience'),
    'Laundry / dry cleaning': tL('bizLaundry'),
    'Beauty / spa': tL('bizBeauty'),
    'Bakery / pastry shop': tL('bizBakery'),
    'Electronics / tech': tL('bizElectronics'),
    'Tattoo / piercing': tL('bizTattoo'),
  }[v] ?? v);

  const handleExtend = async () => {
    if (!id) return;
    setExtending(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id, kind: 'extend' }),
      });
      const { url } = await res.json();
      if (url) { window.location.href = url as string; return; }
      throw new Error();
    } catch {
      setExtending(false);
    }
  };

  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id, locale }),
      });
      let json: { analysis?: AiAnalysis; error?: string } = {};
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

  const handleRentalPotential = async () => {
    if (!id) return;
    setLoadingRental(true);
    setRentalError(null);
    try {
      const res = await fetch('/api/rental-potential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      });
      let json: { rental?: RentalEstimate; error?: string } = {};
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server error (${res.status}) — check ANTHROPIC_API_KEY`);
      }
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
      if (!json.rental) throw new Error('No estimate returned');
      setRental(json.rental);
    } catch (e) {
      setRentalError(e instanceof Error ? e.message : 'Unknown error');
    }
    setLoadingRental(false);
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
      const merged = { ...competition_data, ai_analysis: property?.competition_data?.ai_analysis };
      const saveRes = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competition_data: merged }),
      });
      if (!saveRes.ok) throw new Error('Error saving the analysis');
      setProperty(prev => prev ? { ...prev, competition_data: merged } : prev);
    } catch (e) {
      setZoneError(e instanceof Error ? e.message : 'Unknown error');
    }
    setRunningZone(false);
  };

  const handleSendInquiry = async () => {
    if (inqSelected.length === 0 && !inqMessage.trim()) return;
    setInqSending(true);
    setInqError(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: id,
          senderName: inqName.trim() || null,
          senderEmail: inqEmail.trim() || null,
          questions: inqSelected,
          message: inqMessage.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? 'Could not send message');
      }
      setInqSent(true);
    } catch (e) {
      setInqError(e instanceof Error ? e.message : 'Unknown error');
    }
    setInqSending(false);
  };

  const fetchInquiries = async () => {
    if (!id) return;
    setLoadingInq(true);
    const res = await fetch(`/api/inquiries?propertyId=${id}`);
    if (res.ok) setInquiries(await res.json());
    setLoadingInq(false);
  };

  const markRead = async (inquiryId: string) => {
    await fetch('/api/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiryId, propertyId: id }),
    });
    setInquiries(prev => prev.map(q => q.id === inquiryId ? { ...q, is_read: true } : q));
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/properties/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) setNotFound(true);
        else {
          setProperty(data as Property);
          if (data.competition_data?.ai_analysis) {
            setAnalysis(data.competition_data.ai_analysis as AiAnalysis);
          }
          if (data.lat && data.lng) {
            fetch('/api/isochrone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: data.lat, lng: data.lng }),
            })
              .then(r => r.json())
              .then(d => { if (Array.isArray(d.features)) setIsochrones(d.features); })
              .catch(() => {});
          }
        }
        setLoading(false);
      });
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
        <NavHeader />
        <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
        <div style={{ maxWidth: 900, margin: '80px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[320, 80, 160, 120].map((h, i) => (
            <div key={i} style={{ height: h, background: '#e4e7f4', borderRadius: 16, animation: 'shimmer 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </main>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !property) {
    return (
      <main style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
        <NavHeader />
        <div style={{ maxWidth: 600, margin: '120px auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{tP('notFound')}</h1>
          <p style={{ color: MUTED, marginBottom: 32 }}>{tP('notFoundDesc')}</p>
          <Link href="/propiedades" style={{
            background: 'linear-gradient(135deg, #0f1b3d, #3b6fa0)', color: '#ffffff',
            padding: '12px 28px', borderRadius: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            {tP('backToProperties')}
          </Link>
        </div>
      </main>
    );
  }

  const p = property;
  const photos = p.photo_urls?.length > 0 ? p.photo_urls : null;

  const stats = [
    stat('📐', tP('statLandArea'), `${p.m2} m²`),
    stat('🏗️', tP('statBuiltArea'), p.m2_construccion ? `${p.m2_construccion} m²` : null),
    stat('↔️', tP('statFrontage'), p.frente_m ? `${p.frente_m} m` : null),
    stat('↕️', tP('statDepth'), p.fondo_m ? `${p.fondo_m} m` : null),
    stat('⬆️', tP('statCeiling'), p.altura_techo_m ? `${p.altura_techo_m} m` : null),
    stat('🏢', tP('statFloor'), p.nivel_piso ? nivelLabel(p.nivel_piso) : null),
    stat('📅', tP('statAge'), p.antiguedad ? tP('ageValue', { n: p.antiguedad }) : null),
    stat('🔲', tP('statLotType'), p.tipo_terreno ? terrenoLabel(p.tipo_terreno) : null),
    stat('🔧', tP('statCondition'), p.estado_conservacion ? conservacionLabel(p.estado_conservacion) : null),
    stat('🏆', tP('statQuality'), p.calidad_construccion ? calidadLabel(p.calidad_construccion) : null),
    stat('⚡', tP('statElectrical'), p.tipo_energia ? energiaLabel(p.tipo_energia) : null),
    stat('🗺️', tP('statZoning'), p.uso_suelo ? sueloLabel(p.uso_suelo) : null),
    stat('💧', tP('statWater'), p.agua_drenaje ? aguaLabel(p.agua_drenaje) : null),
    stat('🚿', tP('statBathrooms'), p.banos || null),
    stat('🚪', tP('statRooms'), p.habitaciones || null),
    stat('🅿️', tP('statParking'), p.estacionamientos || null),
    stat('🔄', tP('statLastUse'), p.uso_anterior ? usoAnteriorLabel(p.uso_anterior) : null),
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  const competition = p.competition_data;
  const isOwner = session?.user?.email === p.user_email;
  const expiresAt = p.expires_at ? new Date(p.expires_at) : null;
  const isExpired = expiresAt ? expiresAt.getTime() <= nowTs : false;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - nowTs) / 86_400_000) : null;
  const mapsUrl = p.lat && p.lng
    ? `https://www.google.com/maps?q=${p.lat},${p.lng}`
    : p.calle
    ? `https://www.google.com/maps/search/${encodeURIComponent([p.numero, p.calle, p.colonia, 'CDMX'].filter(Boolean).join(', '))}`
    : null;

  return (
    <main style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Back */}
        <Link href="/propiedades" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: MUTED, textDecoration: 'none', marginBottom: 32, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>
          {tP('backAll')}
        </Link>

        {/* ── Owner: listing expiry / extend ── */}
        {isOwner && expiresAt && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            background: isExpired ? 'rgba(220,38,38,0.06)' : 'rgba(59,111,160,0.06)',
            border: `1px solid ${isExpired ? 'rgba(220,38,38,0.25)' : 'rgba(59,111,160,0.25)'}`,
            borderRadius: 12, padding: '14px 18px', marginBottom: 28,
          }}>
            <div style={{ fontSize: 14, color: TEXT }}>
              {isExpired
                ? tP('expired')
                : tP('active', { days: daysLeft ?? 0, date: expiresAt.toLocaleDateString('es-MX') })}
            </div>
            <button
              onClick={handleExtend}
              disabled={extending}
              style={{
                background: 'linear-gradient(135deg, #0f1b3d, #3b6fa0)', color: '#ffffff',
                padding: '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13,
                border: 'none', cursor: extending ? 'wait' : 'pointer', whiteSpace: 'nowrap',
              }}>
              {extending ? tP('redirecting') : isExpired ? tP('republish') : tP('extend')}
            </button>
          </div>
        )}

        {/* ── Photo gallery ── */}
        {photos ? (
          <div style={{ marginBottom: 36 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', height: 420, background: '#edf0f8', marginBottom: 10, position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[activePhoto]} alt={`Photo ${activePhoto + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }} />
              <span style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: MUTED }}>
                {activePhoto + 1} / {photos.length}
              </span>
            </div>
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {photos.map((src, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)} style={{
                    flexShrink: 0, width: 80, height: 60, borderRadius: 8, overflow: 'hidden',
                    border: i === activePhoto ? `2px solid ${ACCENT}` : '2px solid transparent',
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
          <div style={{ height: 220, borderRadius: 16, background: '#edf0f8', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 36, opacity: 0.4 }}>
            {TIPO_ICONS[p.tipo_local] ?? '🏬'}
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: ACCENT2, textTransform: 'uppercase' }}>
                {p.colonia}
              </span>
              {(p.city || p.state || p.country) && (
                <span style={{ fontSize: 11, color: MUTED, fontFamily: "'DM Mono', monospace" }}>
                  {[p.city, p.state, p.country].filter(Boolean).join(', ')}
                </span>
              )}
              {p.modalidad && (
                <span style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 100,
                  padding: '3px 10px',
                  background: p.modalidad === 'rent' ? 'rgba(59,111,160,0.1)' : 'rgba(15,27,61,0.07)',
                  border: `1px solid ${p.modalidad === 'rent' ? 'rgba(59,111,160,0.35)' : 'rgba(15,27,61,0.2)'}`,
                  color: p.modalidad === 'rent' ? ACCENT : ACCENT2,
                }}>
                  {p.modalidad === 'rent' ? tP('forRent') : tP('forSale')}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 6, letterSpacing: '-0.02em', color: TEXT }}>
              {tipoLabel(p.tipo_local)}{p.calle ? ` · ${p.calle}${p.numero ? ` ${p.numero}` : ''}` : ''}
            </h1>
            <p style={{ color: MUTED, fontSize: 14 }}>
              {tP('published', { date: new Date(p.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) })}
            </p>
          </div>

          {/* Price block */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 24px', minWidth: 200, textAlign: 'right', boxShadow: '0 2px 12px rgba(15,27,61,0.06)' }}>
            <div style={{ fontSize: 11, color: SUBTLE, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>
              {p.modalidad === 'rent' ? tP('priceRent') : p.modalidad === 'sale' ? tP('priceSale') : tP('priceLabel')}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: '-0.01em' }}>
              {formatPrice(p.precio_inmueble)}
            </div>
            {p.precio_mantenimiento && (
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                {tP('maintenance', { price: formatPrice(p.precio_mantenimiento) })}
              </div>
            )}
            {(p.tipo_contrato || p.fecha_disponible) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                {p.tipo_contrato && (
                  <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 9px', background: 'rgba(59,111,160,0.07)', border: '1px solid rgba(59,111,160,0.2)', color: ACCENT }}>
                    {p.tipo_contrato}
                  </span>
                )}
                {p.fecha_disponible && (
                  <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 9px', background: '#f0f2fa', border: `1px solid ${BORDER}`, color: SUBTLE }}>
                    {tP('available', { date: new Date(p.fecha_disponible).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' }) })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20, marginBottom: 24 }}>

          {/* Stats */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(15,27,61,0.05)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: SUBTLE, marginBottom: 18, textTransform: 'uppercase' }}>{tP('sectionDetails')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 11, color: SUBTLE, marginBottom: 3 }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Services */}
            {p.servicios && p.servicios.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: SUBTLE, marginBottom: 10, textTransform: 'uppercase' }}>{tP('sectionServices')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.servicios.map(s => (
                    <span key={s} style={{
                      fontSize: 11, fontFamily: "'DM Mono', monospace",
                      padding: '4px 10px', borderRadius: 7,
                      background: 'rgba(59,111,160,0.07)', border: '1px solid rgba(59,111,160,0.2)',
                      color: ACCENT,
                    }}>
                      {servicioLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Business preferences */}
            {((p.usos_permitidos && p.usos_permitidos.length > 0) || (p.usos_no_preferidos && p.usos_no_preferidos.length > 0)) && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: SUBTLE, marginBottom: 14, textTransform: 'uppercase' }}>
                  {tP('sectionPreferences')}
                </p>
                {p.usos_permitidos && p.usos_permitidos.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'oklch(0.42 0.14 155)', marginBottom: 7, letterSpacing: '0.06em' }}>
                      {tP('idealUses')}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.usos_permitidos.map(u => (
                        <span key={u} style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 7,
                          background: 'oklch(0.97 0.05 155)', border: '1px solid oklch(0.86 0.1 155)',
                          color: 'oklch(0.40 0.14 155)', fontWeight: 600,
                        }}>
                          {bizLabel(u)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {p.usos_no_preferidos && p.usos_no_preferidos.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'oklch(0.50 0.18 25)', marginBottom: 7, letterSpacing: '0.06em' }}>
                      {tP('notPreferred')}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.usos_no_preferidos.map(u => (
                        <span key={u} style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 7,
                          background: 'oklch(0.97 0.04 25)', border: '1px solid oklch(0.88 0.1 25)',
                          color: 'oklch(0.50 0.18 25)', fontWeight: 600,
                        }}>
                          {bizLabel(u)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Embedded map */}
            {p.lat && p.lng && (
              <div style={{ marginTop: 20 }}>
                <MapView lat={p.lat} lng={p.lng} isochrones={isochrones} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {isochrones.length > 0 && (
                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: SUBTLE }}>
                      <span><span style={{ color: ACCENT }}>●</span> {tP('walk5')}</span>
                      <span><span style={{ color: '#4a7fb5' }}>●</span> {tP('walk10')}</span>
                      <span><span style={{ color: '#6b5ce7' }}>●</span> {tP('walk15')}</span>
                    </div>
                  )}
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 600, color: ACCENT, textDecoration: 'none',
                      opacity: 0.8, transition: 'opacity 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
                    >
                      {tP('openMaps')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Competition & Opportunities */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(15,27,61,0.05)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: SUBTLE, marginBottom: 18, textTransform: 'uppercase' }}>{tP('sectionZone')}</p>

            {!competition ? (
              <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
                {isOwner && p.lat && p.lng ? (
                  <div>
                    <p style={{ marginBottom: 14 }}>{tP('noZoneYet')}</p>
                    {zoneError && (
                      <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>{zoneError}</p>
                    )}
                    <button
                      onClick={handleAnalyzeZone}
                      disabled={runningZone}
                      style={{
                        background: runningZone ? '#f0f2fa' : 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
                        color: runningZone ? ACCENT : '#ffffff',
                        border: runningZone ? `1px solid ${BORDER}` : 'none',
                        borderRadius: 8, padding: '10px 20px',
                        fontWeight: 700, fontSize: 13, cursor: runningZone ? 'not-allowed' : 'pointer',
                        fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {runningZone ? tP('analyzingZone') : tP('analyzeNow')}
                    </button>
                  </div>
                ) : (
                  <>
                    <p>{tP('noZoneData')}</p>
                    <p style={{ marginTop: 8 }}>{tP('zoneRequiresPin')}</p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Tourist context */}
                {competition.tourist_context && (() => {
                  const tc = competition.tourist_context!;
                  const zoneLabels: Record<string, string> = {
                    cultural: tP('zoneCultural'),
                    religious: tP('zoneReligious'),
                    entertainment: tP('zoneEntertainment'),
                    nature: tP('zoneNature'),
                    mixed: tP('zoneMixed'),
                  };
                  return (
                    <div style={{ marginBottom: 20, padding: '16px', borderRadius: 10, background: 'oklch(0.98 0.03 70)', border: '1px solid oklch(0.88 0.08 70)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'oklch(0.48 0.14 70)', marginBottom: 12, textTransform: 'uppercase' }}>
                        {tP('touristZone', { type: zoneLabels[tc.zone_type] ?? tc.zone_type })}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        {tc.nearby_attractions.map((a, i) => (
                          <span key={i} style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", padding: '3px 9px', borderRadius: 6, background: 'oklch(0.97 0.04 70)', border: '1px solid oklch(0.88 0.1 70)', color: 'oklch(0.52 0.14 70)' }}>
                            {a.name} · {a.type}
                          </span>
                        ))}
                      </div>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'oklch(0.48 0.14 70)', marginBottom: 8, textTransform: 'uppercase' }}>
                        {tP('recommendedBiz')}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {tc.suggestions.map((s, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'oklch(0.52 0.14 70)' }}>{s.category}</span>
                            <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{s.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Opportunities */}
                {competition.opportunities?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: ACCENT, marginBottom: 10, textTransform: 'uppercase' }}>
                      {tP('opportunities')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {competition.opportunities.map((o) => (
                        <div key={o.category} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: 8,
                          background: o.score === 'high' ? 'rgba(59,111,160,0.07)' : '#f5f6fc',
                          border: `1px solid ${o.score === 'high' ? 'rgba(59,111,160,0.2)' : BORDER}`,
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{o.category}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, color: MUTED, fontFamily: "'DM Mono', monospace" }}>
                              {tP('within500m2km', { count500m: o.count_500m, count2km: o.count_2km })}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                              background: o.score === 'high' ? 'rgba(59,111,160,0.1)' : '#edf0f8',
                              color: ACCENT, fontFamily: "'DM Mono', monospace", letterSpacing: '0.05em',
                            }}>
                              {o.score === 'high' ? tP('scoreHigh') : tP('scoreMedium')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Food subcategory gaps */}
                {competition.food_subcategories?.gaps && competition.food_subcategories.gaps.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'oklch(0.42 0.14 155)', marginBottom: 6, textTransform: 'uppercase' }}>
                      {tP('foodGaps')}
                    </p>
                    <p style={{ fontSize: 12, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
                      {tP('foodGapsDesc')}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {competition.food_subcategories.gaps.map((gap) => (
                        <span key={gap} style={{
                          fontSize: 12, fontWeight: 600,
                          padding: '5px 12px', borderRadius: 8,
                          background: 'oklch(0.97 0.05 155)', border: '1px solid oklch(0.86 0.1 155)',
                          color: 'oklch(0.40 0.14 155)',
                        }}>
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saturated */}
                {competition.saturated?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#dc2626', marginBottom: 10, textTransform: 'uppercase' }}>
                      {tP('saturated')}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {competition.saturated.map((s) => (
                        <span key={s.category} style={{
                          fontSize: 11, fontFamily: "'DM Mono', monospace",
                          padding: '4px 10px', borderRadius: 7,
                          background: 'oklch(0.97 0.04 25)', border: '1px solid oklch(0.88 0.1 25)',
                          color: 'oklch(0.50 0.18 25)',
                        }}>
                          {tP('saturatedItem', { category: s.category, count: s.count_500m })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div style={{ borderTop: `1px solid ${BORDER}`, marginBottom: 16 }} />

                {/* Top nearby list */}
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: SUBTLE, marginBottom: 10, textTransform: 'uppercase' }}>
                  {tP('nearestBiz')}
                </p>
                {competition.top_nearby.filter(b => b.category).slice(0, 5).map((b, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: `1px solid ${BORDER}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{b.category}</div>
                    </div>
                    {b.rating && (
                      <span style={{ fontSize: 12, color: 'oklch(0.52 0.14 70)', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>★ {b.rating}</span>
                    )}
                  </div>
                ))}
                {competition.top_nearby.filter(b => b.category).length === 0 && (
                  <p style={{ fontSize: 12, color: MUTED }}>{tP('noBiz500m')}</p>
                )}

                {/* Transit section */}
                {competition.nearby_transit && competition.nearby_transit.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: SUBTLE, margin: '20px 0 10px', textTransform: 'uppercase' }}>
                      {tP('nearbyTransit')}
                    </p>
                    {competition.nearby_transit.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{t.icon}</span>
                          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{t.name}</div>
                        </div>
                        {t.distance_m !== null && (
                          <span style={{ fontSize: 12, color: MUTED, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                            {t.distance_m < 1000 ? `${t.distance_m} m` : `${(t.distance_m / 1000).toFixed(1)} km`}
                          </span>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        {p.descripcion && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(15,27,61,0.05)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: SUBTLE, marginBottom: 14, textTransform: 'uppercase' }}>{tP('sectionDesc')}</p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: MUTED }}>{p.descripcion}</p>
          </div>
        )}

        {/* ── AI Analysis ── */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(15,27,61,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: SUBTLE, marginBottom: 4, textTransform: 'uppercase' }}>{tP('sectionAI')}</p>
                <p style={{ fontSize: 13, color: MUTED }}>{tP('aiSubtitle')}</p>
              </div>
              {!analysis && session?.user && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  style={{
                    background: analyzing ? '#f0f2fa' : 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
                    color: analyzing ? ACCENT : '#ffffff',
                    border: analyzing ? `1px solid ${BORDER}` : 'none',
                    padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
                    cursor: analyzing ? 'default' : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'opacity 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {analyzing ? (
                    <>
                      <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      {tP('analyzing')}
                    </>
                  ) : tP('analyzeAI')}
                </button>
              )}
            </div>

            {analyzeError && (
              <p style={{ fontSize: 13, color: '#dc2626', fontFamily: "'DM Mono', monospace" }}>{analyzeError}</p>
            )}

            {analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100,
                    background: analysis.nivel_competencia === 'high' ? 'oklch(0.97 0.04 25)' : analysis.nivel_competencia === 'medium' ? 'oklch(0.98 0.03 70)' : 'oklch(0.97 0.05 155)',
                    border: `1px solid ${analysis.nivel_competencia === 'high' ? 'oklch(0.88 0.1 25)' : analysis.nivel_competencia === 'medium' ? 'oklch(0.88 0.08 70)' : 'oklch(0.88 0.1 155)'}`,
                    color: analysis.nivel_competencia === 'high' ? 'oklch(0.50 0.18 25)' : analysis.nivel_competencia === 'medium' ? 'oklch(0.52 0.14 70)' : 'oklch(0.42 0.14 155)',
                  }}>
                    {analysis.nivel_competencia === 'high' ? tP('competitionHigh') : analysis.nivel_competencia === 'medium' ? tP('competitionMedium') : tP('competitionLow')}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{analysis.oportunidad}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: SUBTLE, textTransform: 'uppercase' }}>{tP('recommendedUses')}</p>
                  {analysis.usos_recomendados.map((item, i) => (
                    <div key={i} style={{ background: '#f5f6fc', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT2, marginBottom: 4 }}>{item.uso}</div>
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{item.razon}</div>
                    </div>
                  ))}
                </div>

                {analysis.advertencia && (
                  <div style={{ background: 'oklch(0.98 0.03 70)', border: '1px solid oklch(0.88 0.08 70)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 12, color: 'oklch(0.52 0.14 70)', lineHeight: 1.5 }}>⚠ {analysis.advertencia}</p>
                  </div>
                )}
              </div>
            )}

            {!analysis && !session?.user && (
              <p style={{ fontSize: 13, color: MUTED }}>{tP('loginToAnalyze')}</p>
            )}
          </div>

        {/* ── Inquiry form (non-owners) ── */}
        {!isOwner && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(15,27,61,0.05)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: SUBTLE, marginBottom: 4, textTransform: 'uppercase' }}>
              {tP('contactOwner')}
            </p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
              {tP('contactOwnerDesc')}
            </p>

            {inqSent ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{tP('messageSent')}</p>
                <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>{tP('ownerContactsSoon')}</p>
                <button
                  onClick={() => { setInqSent(false); setInqSelected([]); setInqMessage(''); setInqName(''); setInqEmail(''); }}
                  style={{ fontSize: 12, color: MUTED, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                >
                  {tP('sendAnother')}
                </button>
              </div>
            ) : (
              <>
                {/* Preset question chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {PRESET_QUESTIONS.map((q) => {
                    const active = inqSelected.includes(q);
                    return (
                      <button
                        key={q}
                        onClick={() => setInqSelected(prev => active ? prev.filter(x => x !== q) : [...prev, q])}
                        style={{
                          fontSize: 13, padding: '7px 14px', borderRadius: 100,
                          border: `1px solid ${active ? ACCENT : BORDER}`,
                          background: active ? 'rgba(59,111,160,0.08)' : CARD,
                          color: active ? ACCENT : TEXT,
                          cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                          fontWeight: active ? 700 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        {active ? '✓ ' : ''}{q}
                      </button>
                    );
                  })}
                </div>

                {/* Free text */}
                <textarea
                  value={inqMessage}
                  onChange={e => setInqMessage(e.target.value)}
                  placeholder={tP('writePlaceholder')}
                  rows={3}
                  style={{
                    width: '100%', resize: 'vertical', padding: '12px 14px',
                    border: `1px solid ${BORDER}`, borderRadius: 10,
                    fontSize: 14, color: TEXT, background: CARD2,
                    fontFamily: "'Inter', sans-serif", outline: 'none',
                    boxSizing: 'border-box', marginBottom: 14,
                  }}
                />

                {/* Sender info — only shown to guests */}
                {!session?.user && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <input
                      type="text"
                      value={inqName}
                      onChange={e => setInqName(e.target.value)}
                      placeholder={tP('namePlaceholder')}
                      style={{ padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT, background: CARD2, fontFamily: "'Inter', sans-serif", outline: 'none' }}
                    />
                    <input
                      type="email"
                      value={inqEmail}
                      onChange={e => setInqEmail(e.target.value)}
                      placeholder={tP('emailPlaceholder')}
                      style={{ padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT, background: CARD2, fontFamily: "'Inter', sans-serif", outline: 'none' }}
                    />
                  </div>
                )}

                {inqError && (
                  <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>{inqError}</p>
                )}

                <button
                  onClick={handleSendInquiry}
                  disabled={inqSending || (inqSelected.length === 0 && !inqMessage.trim())}
                  style={{
                    background: (inqSelected.length === 0 && !inqMessage.trim()) || inqSending
                      ? '#f0f2fa' : 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
                    color: (inqSelected.length === 0 && !inqMessage.trim()) || inqSending ? SUBTLE : '#ffffff',
                    border: 'none', borderRadius: 10, padding: '11px 24px',
                    fontSize: 14, fontWeight: 700, cursor: inqSending ? 'wait' : 'pointer',
                    fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                  }}
                >
                  {inqSending ? tP('sending') : tP('sendMessage')}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Owner inbox ── */}
        {isOwner && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(15,27,61,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: SUBTLE, marginBottom: 4, textTransform: 'uppercase' }}>
                  {tP('inbox')}
                </p>
                <p style={{ fontSize: 13, color: MUTED }}>{tP('inboxSubtitle')}</p>
              </div>
              <button
                onClick={() => {
                  const opening = !inboxOpen;
                  setInboxOpen(opening);
                  if (opening && inquiries.length === 0) fetchInquiries();
                }}
                style={{
                  background: inboxOpen ? '#f0f2fa' : 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
                  color: inboxOpen ? ACCENT : '#ffffff',
                  border: inboxOpen ? `1px solid ${BORDER}` : 'none',
                  borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}
              >
                {inboxOpen ? tP('hide') : tP('viewInquiries')}
              </button>
            </div>

            {inboxOpen && (
              <div style={{ marginTop: 20 }}>
                {loadingInq ? (
                  <div style={{ color: MUTED, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>{tP('loadingInquiries')}</div>
                ) : inquiries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: MUTED }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                    <p style={{ fontSize: 14 }}>{tP('noInquiries')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        onClick={() => { if (!inq.is_read) markRead(inq.id); }}
                        style={{
                          background: inq.is_read ? CARD2 : 'rgba(59,111,160,0.04)',
                          border: `1px solid ${inq.is_read ? BORDER : 'rgba(59,111,160,0.25)'}`,
                          borderRadius: 12, padding: '16px 18px', cursor: inq.is_read ? 'default' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>
                              {inq.sender_name ?? tP('anonymous')}
                            </span>
                            {inq.sender_email && (
                              <a href={`mailto:${inq.sender_email}`} style={{ fontSize: 12, color: ACCENT, marginLeft: 8, textDecoration: 'none' }}>
                                {inq.sender_email}
                              </a>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {!inq.is_read && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(59,111,160,0.1)', border: '1px solid rgba(59,111,160,0.3)', color: ACCENT, letterSpacing: '0.06em' }}>
                                {tP('newBadge')}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: SUBTLE, fontFamily: "'DM Mono', monospace" }}>
                              {new Date(inq.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {inq.questions.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: inq.message ? 10 : 0 }}>
                            {inq.questions.map((q) => (
                              <span key={q} style={{
                                fontSize: 12, padding: '4px 10px', borderRadius: 100,
                                background: 'rgba(59,111,160,0.07)', border: '1px solid rgba(59,111,160,0.2)',
                                color: ACCENT,
                              }}>{q}</span>
                            ))}
                          </div>
                        )}

                        {inq.message && (
                          <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, margin: 0 }}>{inq.message}</p>
                        )}

                        {inq.sender_email && (
                          <div style={{ marginTop: 12 }}>
                            <a
                              href={`mailto:${inq.sender_email}?subject=Re: ${encodeURIComponent(tipoLabel(p.tipo_local) + ' en ' + p.colonia)}&body=${encodeURIComponent('Hola ' + (inq.sender_name ?? '') + ',\n\nGracias por tu interés en la propiedad.\n\n')}`}
                              style={{
                                display: 'inline-block', fontSize: 12, fontWeight: 700,
                                color: ACCENT, border: `1px solid rgba(59,111,160,0.3)`,
                                borderRadius: 8, padding: '5px 12px', textDecoration: 'none',
                              }}
                            >
                              {tP('reply')}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Bottom CTAs ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/registro" style={{
            background: 'linear-gradient(135deg, #0f1b3d, #3b6fa0)', color: '#ffffff',
            padding: '13px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14,
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(15,27,61,0.2)',
          }}>
            {tP('registerSimilar')}
          </Link>
          <Link href="/propiedades" style={{
            background: 'transparent', color: MUTED,
            padding: '13px 28px', borderRadius: 12, fontWeight: 600, fontSize: 14,
            textDecoration: 'none', border: `1px solid ${BORDER}`,
            transition: 'border-color 0.2s, color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT2; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
          >
            {tP('backToAllProperties')}
          </Link>
        </div>

      </div>
    </main>
  );
}
