"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase";
import {
  ThemeProvider, createTheme, Box, Typography, Button, Stepper, Step, StepLabel,
  TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Grid, Card,
  CircularProgress, IconButton, Autocomplete, Checkbox, FormGroup, FormControlLabel,
} from "@mui/material";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 280, borderRadius: '12px', bgcolor: 'var(--surface-2)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" color="text.secondary">Loading map...</Typography>
    </Box>
  )
});

const darkTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f1b3d' },
    secondary: { main: '#3b6fa0' },
    background: { default: '#f7f8fd', paper: '#ffffff' },
    text: { primary: '#181e38', secondary: '#5a6288' },
    error: { main: '#e53935' },
  },
  typography: {
    fontFamily: "'Syne', sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    body1: { fontFamily: "'DM Mono', monospace" },
    body2: { fontFamily: "'DM Mono', monospace" },
    button: { fontWeight: 700, textTransform: 'none' },
    caption: { fontFamily: "'DM Mono', monospace" },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontFamily: "'DM Mono', monospace",
          borderRadius: 8,
          backgroundColor: '#edf0f8',
          '& fieldset': { borderColor: '#d5daea' },
          '&:hover fieldset': { borderColor: '#a4b4d2' },
          '&.Mui-focused fieldset': { borderColor: '#3b6fa0' },
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontFamily: "'DM Mono', monospace", color: '#5a6288', fontSize: '14px' }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: '12px 24px' },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
          color: '#f7f8fd',
          '&:hover': { opacity: 0.9, transform: 'scale(1.02)' },
          transition: 'all 0.2s',
        },
        outlined: {
          borderColor: '#d5daea',
          color: '#181e38',
          '&:hover': { backgroundColor: '#edf0f8', borderColor: '#a4b4d2' }
        }
      }
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: '#d5daea',
          border: '2px solid #cad2e4',
          borderRadius: '50%',
          '&.Mui-active': { color: '#f7f8fd', border: '2px solid #3b6fa0', backgroundColor: '#0f1b3d' },
          '&.Mui-completed': { color: '#3b6fa0', border: 'none' }
        },
        text: { fill: '#5a6288', fontFamily: "'Syne', sans-serif", fontWeight: 800 },
      }
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontFamily: "'DM Mono', monospace", color: '#787ea0', '&.Mui-active': { color: '#181e38', fontWeight: 700 } }
      }
    }
  }
});

interface FormData {
  colonia: string; calle: string; numero: string;
  descripcion: string;
  tipoLocal: string; m2: number | ''; antiguedad: number | '';
  nivelPiso: string; usoAnterior: string;
  aguaDrenaje: string; habitaciones: number; banos: number; estacionamientos: number;
  modalidad: string; precioInmueble: string; precioMantenimiento: string;
  tipoContrato: string; fechaDisponible: string;
  m2Construccion: number | '';
  frenteM: number | ''; fondoM: number | '';
  alturaTechoM: number | '';
  tipoTerreno: string; estadoConservacion: string;
  calidadConstruccion: string; tipoEnergia: string; usoSuelo: string;
  servicios: string[];
  usosPermitidos: string[];
  usosNoPreferidos: string[];
}

interface PinLocation { lat: number; lng: number; }

// ── NumberStepper ──────────────────────────────────────────────
function NumberStepper({ label, value, onChange, min = 0, max = 99 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const btnStyle: React.CSSProperties = {
    width: 34, height: 34, border: '1px solid var(--surface-border)',
    borderRadius: 8, background: 'var(--surface-2)', color: 'var(--brand)',
    fontSize: 20, lineHeight: 1, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.15s', fontFamily: "'Syne', sans-serif",
    userSelect: 'none' as const,
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--muted)', fontSize: 13, letterSpacing: 1 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', border: '1px solid var(--surface-border)', borderRadius: 8, padding: '6px 12px', height: 50 }}>
        <button type="button" style={btnStyle} onClick={() => onChange(Math.max(min, value - 1))}
          onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.9 0.015 250)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}>−</button>
        <span style={{ flex: 1, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: 'oklch(0.18 0.04 260)' }}>{value}</span>
        <button type="button" style={btnStyle} onClick={() => onChange(Math.min(max, value + 1))}
          onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.9 0.015 250)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}>+</button>
      </div>
    </div>
  );
}

interface CompetitionData {
  within_500m:     Record<string, number>;
  within_2km:      Record<string, number>;
  top_nearby:      Array<{ name: string; category: string | null; vicinity: string; rating: number | null }>;
  opportunities:   Array<{ category: string; count_500m: number; count_2km: number; score: 'high' | 'medium' }>;
  saturated:       Array<{ category: string; count_500m: number }>;
  tourist_context: {
    zone_type: 'cultural' | 'religious' | 'entertainment' | 'nature' | 'lodging' | 'mixed';
    attraction_count: number;
    nearby_attractions: Array<{ name: string; type: string }>;
    suggestions: Array<{ category: string; reason: string }>;
  } | null;
}

export default function Plaziia() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations('LocalIQ');
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [pinLocation, setPinLocation] = useState<PinLocation | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [analyzingLocation, setAnalyzingLocation] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [locationOptions, setLocationOptions] = useState<{ label: string; placeId: string; lat?: number; lng?: number }[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapFlyTo, setMapFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [pinAddress, setPinAddress] = useState<{ colonia: string | null; city: string | null; state: string | null; country: string | null } | null>(null);
  const [autoFilledColonia, setAutoFilledColonia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Translated option lists (English value stored in DB, translated label shown) ──
  const steps = [t('stepLocation'), t('stepFeatures'), t('stepDetails')];

  const TIPOS_LOCAL = [
    { value: 'Street-facing (with storefront)', label: t('tipoStreetFacing') },
    { value: 'Inside commercial plaza', label: t('tipoInsidePlaza') },
    { value: 'Corner unit', label: t('tipoCornerUnit') },
    { value: 'Basement / Semi-basement', label: t('tipoBasement') },
    { value: 'Market stall', label: t('tipoMarketStall') },
  ];

  const NIVELES_PISO = [
    { value: 'Ground floor (street level)', label: t('nivelGroundFloor') },
    { value: 'Mezzanine', label: t('nivelMezzanine') },
    { value: '2nd floor', label: t('nivel2ndFloor') },
    { value: '3rd floor or above', label: t('nivel3rdPlus') },
    { value: 'Basement / semi-basement', label: t('nivelBasement') },
  ];

  const USOS_ANTERIORES = [
    { value: 'Restaurant / food service', label: t('usoRestaurant') },
    { value: 'Retail / store', label: t('usoRetail') },
    { value: 'Office', label: t('usoOffice') },
    { value: 'Gym / wellness', label: t('usoGym') },
    { value: 'Beauty / salon', label: t('usoBeauty') },
    { value: 'Medical / clinic', label: t('usoMedical') },
    { value: 'Warehouse', label: t('usoWarehouse') },
    { value: 'Vacant (never used)', label: t('usoVacant') },
    { value: 'Other', label: t('usoOther') },
  ];

  const TIPOS_TERRENO = [
    { value: 'Regular', label: t('terrenoRegular') },
    { value: 'Irregular', label: t('terrenoIrregular') },
    { value: 'Corner lot', label: t('terrenoCornerLot') },
  ];

  const ESTADOS_CONSERVACION = [
    { value: 'New', label: t('conservNew') },
    { value: 'Excellent', label: t('conservExcellent') },
    { value: 'Good', label: t('conservGood') },
    { value: 'Fair', label: t('conservFair') },
    { value: 'Needs renovation', label: t('conservRenovation') },
  ];

  const CALIDADES_CONSTRUCCION = [
    { value: 'High', label: t('calidadHigh') },
    { value: 'Medium', label: t('calidadMedium') },
    { value: 'Low', label: t('calidadLow') },
  ];

  const TIPOS_ENERGIA = [
    { value: 'Single-phase', label: t('energiaSingle') },
    { value: 'Three-phase', label: t('energiaThree') },
    { value: 'Not specified', label: t('energiaNotSpecified') },
  ];

  const USOS_SUELO = [
    { value: 'Commercial', label: t('usoSueloCommercial') },
    { value: 'Industrial', label: t('usoSueloIndustrial') },
    { value: 'Mixed-use', label: t('usoSueloMixed') },
    { value: 'Residential with commercial', label: t('usoSueloResidential') },
    { value: 'Not specified', label: t('usoSueloNotSpecified') },
  ];

  const SERVICIOS_OPCIONES = [
    { value: 'Electricity', label: t('servicioElectricity') },
    { value: 'Exterior lighting', label: t('servicioLighting') },
    { value: 'Reception', label: t('servicioReception') },
    { value: 'Good access', label: t('servicioAccess') },
  ];

  const BUSINESS_TYPES = [
    { value: 'Restaurant / food service', label: t('bizRestaurant') },
    { value: 'Café / coffee shop', label: t('bizCafe') },
    { value: 'Bar / nightlife', label: t('bizBar') },
    { value: 'Retail / boutique', label: t('bizRetail') },
    { value: 'Pharmacy / drugstore', label: t('bizPharmacy') },
    { value: 'Barbershop / hair salon', label: t('bizBarbershop') },
    { value: 'Gym / fitness center', label: t('bizGym') },
    { value: 'Office / coworking', label: t('bizOffice') },
    { value: 'Medical / clinic', label: t('bizMedical') },
    { value: 'Education / tutoring', label: t('bizEducation') },
    { value: 'Convenience store', label: t('bizConvenience') },
    { value: 'Laundry / dry cleaning', label: t('bizLaundry') },
    { value: 'Beauty / spa', label: t('bizBeauty') },
    { value: 'Bakery / pastry shop', label: t('bizBakery') },
    { value: 'Electronics / tech', label: t('bizElectronics') },
    { value: 'Tattoo / piercing', label: t('bizTattoo') },
  ];

  const searchLocation = useCallback((q: string) => {
    if (locationDebounce.current) clearTimeout(locationDebounce.current);
    if (q.length < 2) { setLocationOptions([]); return; }
    locationDebounce.current = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
        const { predictions } = await res.json();
        setLocationOptions(predictions ?? []);
      } catch { /* silently ignore */ }
      setLocationLoading(false);
    }, 300);
  }, []);

  const { control, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      colonia: '', calle: '', numero: '',
      descripcion: '',
      tipoLocal: '', m2: '', antiguedad: '',
      nivelPiso: '', usoAnterior: '',
      aguaDrenaje: '', habitaciones: 0, banos: 0, estacionamientos: 0,
      modalidad: '', precioInmueble: '', precioMantenimiento: '',
      tipoContrato: '', fechaDisponible: '',
      m2Construccion: '', frenteM: '', fondoM: '', alturaTechoM: '',
      tipoTerreno: '', estadoConservacion: '', calidadConstruccion: '',
      tipoEnergia: '', usoSuelo: '', servicios: [],
      usosPermitidos: [], usosNoPreferidos: [],
    },
    mode: 'onTouched'
  });

  const watchModalidad = watch('modalidad');

  const reverseGeocode = useCallback(async (lat: number, lng: number, autoFillNeighborhood = false) => {
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (!res.ok) return;
      const addr = await res.json();
      setPinAddress(addr);
      if (autoFillNeighborhood && addr.colonia) {
        setValue('colonia', addr.colonia, { shouldValidate: true });
        setAutoFilledColonia(true);
      }
    } catch { /* non-blocking */ }
  }, [setValue]);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos(prev => [...prev, ...toAdd]);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPhotoPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    if (toAdd.length > 0) setPhotoError(null);
    e.target.value = '';
  };

  const handlePhotoRemove = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (activeStep === 0) fieldsToValidate = ['colonia'];
    if (activeStep === 1) fieldsToValidate = ['tipoLocal', 'm2', 'nivelPiso'];

    const isStepValid = await trigger(fieldsToValidate);

    if (activeStep === 0 && !pinLocation) {
      setPinError(true);
      return;
    }

    if (isStepValid) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const onSubmit = async (data: FormData) => {
    const missing = 5 - photos.length;
    if (missing > 0) {
      setPhotoError(t('errorPhotosCount', { count: missing }));
      return;
    }
    setPhotoError(null);
    setSubmitError(null);

    if (!session?.user?.email) {
      setSubmitError(t('errorSignIn'));
      return;
    }

    setUploading(true);

    const photoUrls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split('.').pop();
      const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await getSupabase().storage
        .from('property-photos')
        .upload(storagePath, file, { contentType: file.type });
      if (uploadError) {
        setSubmitError(t('errorPhotoUpload'));
        setUploading(false);
        return;
      }
      const { data: urlData } = getSupabase().storage.from('property-photos').getPublicUrl(storagePath);
      photoUrls.push(urlData.publicUrl);
    }

    const payload = {
      colonia: pinAddress?.colonia ?? data.colonia,
      city:    pinAddress?.city    ?? null,
      state:   pinAddress?.state   ?? null,
      country: pinAddress?.country ?? null,
      calle: data.calle || null,
      numero: data.numero || null,
      descripcion: data.descripcion || null,
      tipo_local: data.tipoLocal,
      m2: Number(data.m2),
      antiguedad: data.antiguedad !== '' ? Number(data.antiguedad) : null,
      nivel_piso: data.nivelPiso || null,
      uso_anterior: data.usoAnterior || null,
      agua_drenaje: data.aguaDrenaje || null,
      habitaciones: data.habitaciones,
      banos: data.banos,
      estacionamientos: data.estacionamientos,
      modalidad: data.modalidad || null,
      precio_inmueble: data.precioInmueble !== '' ? Number(data.precioInmueble) : null,
      precio_mantenimiento: data.precioMantenimiento !== '' ? Number(data.precioMantenimiento) : null,
      lat: pinLocation?.lat ?? null,
      lng: pinLocation?.lng ?? null,
      photo_urls: photoUrls,
      m2_construccion: data.m2Construccion !== '' ? Number(data.m2Construccion) : null,
      frente_m: data.frenteM !== '' ? Number(data.frenteM) : null,
      fondo_m: data.fondoM !== '' ? Number(data.fondoM) : null,
      altura_techo_m: data.alturaTechoM !== '' ? Number(data.alturaTechoM) : null,
      tipo_terreno: data.tipoTerreno || null,
      estado_conservacion: data.estadoConservacion || null,
      calidad_construccion: data.calidadConstruccion || null,
      tipo_energia: data.tipoEnergia || null,
      uso_suelo: data.usoSuelo || null,
      servicios: data.servicios ?? [],
      tipo_contrato: data.tipoContrato || null,
      fecha_disponible: data.fechaDisponible || null,
      usos_permitidos: data.usosPermitidos ?? [],
      usos_no_preferidos: data.usosNoPreferidos ?? [],
    };

    let created: { id: string; requiresPayment: boolean };
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      created = await res.json();
    } catch {
      setUploading(false);
      setSubmitError(t('errorSaveProperty'));
      return;
    }

    if (created.requiresPayment) {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: created.id, kind: 'extra' }),
        });
        const { url } = await res.json();
        if (url) { window.location.href = url as string; return; }
        throw new Error();
      } catch {
        setUploading(false);
        setSubmitError(t('errorCheckout'));
        return;
      }
    }

    setUploading(false);
    setSubmitted(true);

    if (pinLocation && created.id) {
      setAnalyzingLocation(true);
      try {
        const nearbyRes = await fetch('/api/nearby-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pinLocation.lat, lng: pinLocation.lng, tipoLocal: data.tipoLocal }),
        });
        if (nearbyRes.ok) {
          const competition = await nearbyRes.json() as CompetitionData;
          await fetch(`/api/properties/${created.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ competition_data: competition }),
          });
          await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyId: created.id }),
          });
        }
      } catch { /* analysis is non-blocking */ }
      setAnalyzingLocation(false);
    }

    router.push(`/propiedades/${created.id}`);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400&display=swap');
        .grid-bg { background-image: radial-gradient(circle, #3b6fa0 1.5px, transparent 1.5px); background-size: 28px 28px; }
      `}</style>

      <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", bgcolor: 'background.default', color: 'text.primary', pb: 10 }}>
        <Box className="grid-bg" sx={{ position: "fixed", inset: 0, opacity: 0.12, pointerEvents: "none", zIndex: 0 }} />
        <Box sx={{ position: "fixed", top: -200, right: -200, width: 600, height: 600, background: "radial-gradient(circle, oklch(0.235 0.07 265 / 0.07) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />
        <Box sx={{ position: "fixed", bottom: -200, left: -100, width: 500, height: 500, background: "radial-gradient(circle, oklch(0.55 0.11 250 / 0.07) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

        <Box sx={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <Box mb={6}>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="form-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0f1b3d"/><stop offset="1" stopColor="#3b6fa0"/>
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#form-g)"/>
                <rect x="4" y="8" width="24" height="3" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="5" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.65"/>
                <rect x="19" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.65"/>
                <rect x="12" y="22" width="8" height="7" rx="1.5" fill="white" opacity="0.45"/>
                <circle cx="18.5" cy="26" r="0.9" fill="white" opacity="0.9"/>
              </svg>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>
                Plazi<span style={{ color: "#3b6fa0" }}>ia</span>
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">{t('formSubtitle')}</Typography>
          </Box>

          {/* ── LOADING / REDIRECT STATE ── */}
          {submitted ? (
            <Box py={10} textAlign="center">
              <CircularProgress size={44} sx={{ color: 'oklch(0.55 0.11 250)', mb: 3 }} />
              <Typography variant="h6" fontWeight={700} mb={1}>{t('successTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {analyzingLocation ? t('analyzingMsg') : t('redirectingMsg')}
              </Typography>
            </Box>
          ) : (
            <Card elevation={0} sx={{ border: "1px solid var(--surface-border)", borderRadius: 4, pt: 4, pb: 5, px: { xs: 3, md: 5 } }}>
              <Typography variant="h6" fontWeight={700} mb={1}>{t('formTitle')}</Typography>
              <Typography variant="body2" color="text.secondary" mb={5} sx={{ lineHeight: 1.6 }}>
                {t('formDescription')}
              </Typography>

              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6, '& .MuiStepConnector-line': { borderColor: 'oklch(0.9 0.015 250)' } }}>
                {steps.map((label) => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ minHeight: 240, display: 'flex', flexDirection: 'column', gap: 3 }}>

                  {/* STEP 1: LOCATION */}
                  <Box sx={{ display: activeStep === 0 ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}>
                    <Controller name="colonia" control={control} rules={{ required: t('requiredNeighborhood') }} render={({ field }) => (
                      <FormControl fullWidth error={!!errors.colonia}>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelNeighborhood')} *</InputLabel>
                        <Autocomplete
                          freeSolo
                          options={locationOptions}
                          getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                          loading={locationLoading}
                          inputValue={field.value}
                          onInputChange={(_, val, reason) => {
                            field.onChange(val);
                            searchLocation(val);
                            if (reason === 'input') setAutoFilledColonia(false);
                          }}
                          onChange={(_, val) => {
                            field.onChange(typeof val === 'string' ? val : val?.label ?? '');
                            if (val && typeof val !== 'string' && val.lat && val.lng) {
                              const coords = { lat: val.lat, lng: val.lng };
                              setMapFlyTo(coords);
                              setPinLocation(coords);
                              setPinError(false);
                              reverseGeocode(val.lat, val.lng);
                            }
                          }}
                          filterOptions={(x) => x}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder={t('placeholderNeighborhood')}
                              error={!!errors.colonia}
                              InputProps={{ ...params.InputProps, endAdornment: (<>{locationLoading ? <CircularProgress size={16} sx={{ color: 'oklch(0.55 0.11 250)' }} /> : null}{params.InputProps.endAdornment}</>) }}
                            />
                          )}
                        />
                        {errors.colonia && <FormHelperText>{errors.colonia.message}</FormHelperText>}
                        {autoFilledColonia && !errors.colonia && (
                          <FormHelperText sx={{ color: 'oklch(0.42 0.12 155)', mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {t('autoDetected')}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Controller name="calle" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelStreet')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <TextField {...field} placeholder="Ex: Av. Insurgentes Sur" />
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name="numero" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelNumber')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <TextField {...field} placeholder="Ex: 123" />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    {/* Map pin */}
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: pinError ? '#e53935' : 'oklch(0.45 0.03 260)', letterSpacing: 1, fontSize: 13 }}>
                          {t('labelMapLocation')} *
                        </Typography>
                      </Box>
                      <Box sx={{ borderRadius: '12px', outline: pinError ? '1.5px solid #ff6b6b' : 'none' }}>
                        <MapPicker
                          onLocationSelect={(lat, lng) => { setPinLocation({ lat, lng }); setPinError(false); reverseGeocode(lat, lng, true); }}
                          initialLat={pinLocation?.lat}
                          initialLng={pinLocation?.lng}
                          flyTo={mapFlyTo}
                        />
                      </Box>
                      {pinError ? (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, fontFamily: "'DM Mono', monospace" }}>
                          {t('errorPinRequired')}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontFamily: "'DM Mono', monospace" }}>
                          {t('hintPin')}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* STEP 2: FEATURES */}
                  <Box sx={{ display: activeStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}>
                    <Controller name="tipoLocal" control={control} rules={{ required: t('requiredPropertyType') }} render={({ field }) => (
                      <FormControl fullWidth error={!!errors.tipoLocal}>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelPropertyType')} *</InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="" disabled>{t('placeholderPropertyType')}</MenuItem>
                          {TIPOS_LOCAL.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                        {errors.tipoLocal && <FormHelperText>{errors.tipoLocal.message}</FormHelperText>}
                      </FormControl>
                    )} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller name="m2" control={control} rules={{ required: t('requiredSize'), min: 1 }} render={({ field }) => (
                          <FormControl fullWidth error={!!errors.m2}>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelSize')} *</InputLabel>
                            <TextField {...field} type="number" placeholder="Ex: 45" />
                            {errors.m2 && <FormHelperText>{errors.m2.message}</FormHelperText>}
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="antiguedad" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelAge')}</InputLabel>
                            <TextField {...field} type="number" placeholder="Ex: 10" />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    <Controller name="nivelPiso" control={control} rules={{ required: t('requiredFloorLevel') }} render={({ field }) => (
                      <FormControl fullWidth error={!!errors.nivelPiso}>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelFloorLevel')} *</InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="" disabled>{t('placeholderFloorLevel')}</MenuItem>
                          {NIVELES_PISO.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                        {errors.nivelPiso && <FormHelperText>{errors.nivelPiso.message}</FormHelperText>}
                      </FormControl>
                    )} />

                    <Controller name="usoAnterior" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelLastUse')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('placeholderLastUse')}</MenuItem>
                          {USOS_ANTERIORES.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller name="m2Construccion" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelConstruction')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <TextField {...field} type="number" placeholder="Ex: 175" />
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="frenteM" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelFrontage')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <TextField {...field} type="number" placeholder="Ex: 7.2" />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller name="fondoM" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelDepth')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <TextField {...field} type="number" placeholder="Ex: 25" />
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="alturaTechoM" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelCeilingHeight')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <TextField {...field} type="number" placeholder="Ex: 3" />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    <Controller name="tipoTerreno" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelLotType')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('placeholderLotType')}</MenuItem>
                          {TIPOS_TERRENO.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )} />

                    <Controller name="estadoConservacion" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelCondition')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('placeholderCondition')}</MenuItem>
                          {ESTADOS_CONSERVACION.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller name="calidadConstruccion" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelBuildQuality')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <Select {...field} displayEmpty>
                              <MenuItem value="">{t('placeholderSelect')}</MenuItem>
                              {CALIDADES_CONSTRUCCION.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                            </Select>
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="tipoEnergia" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelElectricalType')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <Select {...field} displayEmpty>
                              <MenuItem value="">{t('placeholderSelect')}</MenuItem>
                              {TIPOS_ENERGIA.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                            </Select>
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    <Controller name="usoSuelo" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelLandUseZoning')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('placeholderZoning')}</MenuItem>
                          {USOS_SUELO.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )} />
                  </Box>

                  {/* STEP 3: DETAILS */}
                  <Box sx={{ display: activeStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}>

                    {/* Photo upload */}
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: 'oklch(0.45 0.03 260)', letterSpacing: 1, fontSize: 13 }}>
                          {t('labelPhotos')} *
                        </Typography>
                        <Typography component="span" variant="caption" sx={{ color: photos.length === 5 ? 'oklch(0.55 0.11 250)' : 'oklch(0.45 0.03 260)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                          {photos.length} / 5
                        </Typography>
                      </Box>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoAdd} />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {photoPreviews.map((src, i) => (
                          <Box key={i} sx={{ position: 'relative', width: 90, height: 90, borderRadius: 2, overflow: 'hidden', border: '1px solid #2a2a4a', flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`photo-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <IconButton size="small" onClick={() => handlePhotoRemove(i)} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(10,10,20,0.75)', color: '#e53935', width: 22, height: 22, fontSize: 14, '&:hover': { bgcolor: 'rgba(10,10,20,0.95)' } }}>×</IconButton>
                          </Box>
                        ))}
                        {photos.length < 5 && (
                          <Box onClick={() => fileInputRef.current?.click()} sx={{ width: 90, height: 90, borderRadius: 2, border: '1px dashed #2a2a4a', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'oklch(0.45 0.03 260)', flexShrink: 0, '&:hover': { borderColor: 'oklch(0.55 0.11 250)', color: 'oklch(0.55 0.11 250)' }, transition: 'all 0.15s' }}>
                            <Typography sx={{ fontSize: 24, lineHeight: 1 }}>+</Typography>
                            <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{t('labelAddPhoto')}</Typography>
                          </Box>
                        )}
                      </Box>
                      {photoError && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontFamily: "'DM Mono', monospace" }}>{photoError}</Typography>
                      )}
                    </Box>

                    <Controller name="descripcion" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelDescription')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                        <TextField {...field} multiline rows={3} placeholder={t('placeholderDescription')} />
                      </FormControl>
                    )} />

                    <Controller name="aguaDrenaje" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelWaterDrainage')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('placeholderSelect')}</MenuItem>
                          <MenuItem value="Water and drainage complete">{t('waterComplete')}</MenuItem>
                          <MenuItem value="Water only">{t('waterOnly')}</MenuItem>
                          <MenuItem value="Drainage only">{t('drainageOnly')}</MenuItem>
                          <MenuItem value="No connections">{t('noConnections')}</MenuItem>
                        </Select>
                      </FormControl>
                    )} />

                    <Controller name="servicios" control={control} render={({ field }) => (
                      <FormControl fullWidth component="fieldset">
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelAdditionalServices')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                        <FormGroup row sx={{ gap: 0.5, mt: 0.5 }}>
                          {SERVICIOS_OPCIONES.map(s => (
                            <FormControlLabel
                              key={s.value}
                              label={<Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: 'oklch(0.18 0.04 260)', fontSize: 13 }}>{s.label}</Typography>}
                              control={
                                <Checkbox
                                  checked={field.value.includes(s.value)}
                                  onChange={e => {
                                    const next = e.target.checked
                                      ? [...field.value, s.value]
                                      : field.value.filter((v: string) => v !== s.value);
                                    field.onChange(next);
                                  }}
                                  sx={{ color: 'oklch(0.9 0.015 250)', '&.Mui-checked': { color: 'oklch(0.55 0.11 250)' }, p: 0.75 }}
                                />
                              }
                              sx={{ m: 0, px: 1.5, py: 0.75, border: '1px solid #2a2a4a', borderRadius: 2, bgcolor: 'oklch(0.96 0.01 250)' }}
                            />
                          ))}
                        </FormGroup>
                      </FormControl>
                    )} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Controller name="habitaciones" control={control} render={({ field }) => (
                          <NumberStepper label={t('labelRooms')} value={field.value as number} onChange={field.onChange} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name="banos" control={control} render={({ field }) => (
                          <NumberStepper label={t('labelBathrooms')} value={field.value as number} onChange={field.onChange} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name="estacionamientos" control={control} render={({ field }) => (
                          <NumberStepper label={t('labelParking')} value={field.value as number} onChange={field.onChange} />
                        )} />
                      </Grid>
                    </Grid>

                    <Controller name="modalidad" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelListingType')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">{t('listingNotSpecified')}</MenuItem>
                          <MenuItem value="sale">{t('listingForSale')}</MenuItem>
                          <MenuItem value="rent">{t('listingForRent')}</MenuItem>
                        </Select>
                      </FormControl>
                    )} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller name="tipoContrato" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelContractType')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <Select {...field} displayEmpty>
                              <MenuItem value=""><em>{t('placeholderSelect')}</em></MenuItem>
                              <MenuItem value="Gross">{t('contractGross')}</MenuItem>
                              <MenuItem value="NNN">{t('contractNNN')}</MenuItem>
                              <MenuItem value="Semi-Gross">{t('contractSemiGross')}</MenuItem>
                            </Select>
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="fechaDisponible" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelAvailableDate')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <TextField {...field} type="date" InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().split('T')[0] }} />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="precioInmueble"
                          control={control}
                          rules={{
                            validate: (value) => {
                              if (watchModalidad === 'rent' || watchModalidad === 'sale') {
                                if (!value || value === '') {
                                  return watchModalidad === 'rent' ? t('requiredMonthlyRent') : t('requiredSalePrice');
                                }
                                if (Number(value) <= 0) return t('requiredPositivePrice');
                              }
                              return true;
                            },
                          }}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.precioInmueble}>
                              <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>
                                {watchModalidad === 'rent' ? t('labelMonthlyRent') : watchModalidad === 'sale' ? t('labelSalePrice') : t('labelPrice')}
                                {watchModalidad === 'rent' || watchModalidad === 'sale'
                                  ? <Typography component="span" variant="caption" color="error" ml={0.5}>*</Typography>
                                  : <Typography component="span" variant="caption" color="text.secondary"> {t('optional')}</Typography>
                                }
                              </InputLabel>
                              <TextField
                                {...field}
                                type="number"
                                error={!!errors.precioInmueble}
                                placeholder={watchModalidad === 'rent' ? 'Ex: 15000' : 'Ex: 2500000'}
                                InputProps={{ startAdornment: <Typography variant="body2" color="text.secondary" mr={0.5}>$</Typography> }}
                              />
                              {errors.precioInmueble && <FormHelperText>{errors.precioInmueble.message}</FormHelperText>}
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="precioMantenimiento" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>{t('labelMaintenance')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography></InputLabel>
                            <TextField {...field} type="number" placeholder="Ex: 3500" InputProps={{ startAdornment: <Typography variant="body2" color="text.secondary" mr={0.5}>$</Typography> }} />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    {/* ── Business Preferences ── */}
                    <Controller
                      name="usosPermitidos"
                      control={control}
                      render={({ field: fAllowed }) => (
                        <Controller
                          name="usosNoPreferidos"
                          control={control}
                          render={({ field: fDisallowed }) => (
                            <Box>
                              <Typography variant="body2" sx={{ fontFamily: "'DM Mono', monospace", color: 'var(--muted)', fontSize: 13, letterSpacing: 1, mb: 1.5 }}>
                                {t('labelBusinessPreferences')} <Typography component="span" variant="caption" color="text.secondary">{t('optional')}</Typography>
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, lineHeight: 1.5 }}>
                                {t('hintBusinessPreferences')}
                              </Typography>
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1 }}>
                                {BUSINESS_TYPES.map((tipo) => {
                                  const isAllowed = fAllowed.value.includes(tipo.value);
                                  const isDisallowed = fDisallowed.value.includes(tipo.value);
                                  const toggle = (list: 'allowed' | 'disallowed') => {
                                    if (list === 'allowed') {
                                      const next = isAllowed
                                        ? fAllowed.value.filter((v: string) => v !== tipo.value)
                                        : [...fAllowed.value, tipo.value];
                                      fAllowed.onChange(next);
                                      if (!isAllowed) fDisallowed.onChange(fDisallowed.value.filter((v: string) => v !== tipo.value));
                                    } else {
                                      const next = isDisallowed
                                        ? fDisallowed.value.filter((v: string) => v !== tipo.value)
                                        : [...fDisallowed.value, tipo.value];
                                      fDisallowed.onChange(next);
                                      if (!isDisallowed) fAllowed.onChange(fAllowed.value.filter((v: string) => v !== tipo.value));
                                    }
                                  };
                                  return (
                                    <Box
                                      key={tipo.value}
                                      sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        border: '1px solid',
                                        borderColor: isAllowed ? 'oklch(0.78 0.14 155)' : isDisallowed ? 'oklch(0.78 0.14 25)' : 'var(--surface-border)',
                                        borderRadius: 2, px: 1.5, py: 1,
                                        background: isAllowed ? 'oklch(0.18 0.04 155 / 0.35)' : isDisallowed ? 'oklch(0.18 0.04 25 / 0.35)' : 'var(--surface-2)',
                                        transition: 'all 0.15s',
                                      }}
                                    >
                                      <Typography variant="caption" sx={{ fontSize: 12, color: isAllowed ? 'oklch(0.78 0.14 155)' : isDisallowed ? 'oklch(0.72 0.18 25)' : 'var(--text-secondary)', flex: 1 }}>
                                        {tipo.label}
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                                        <Box component="button" type="button" onClick={() => toggle('allowed')} sx={{ width: 26, height: 26, borderRadius: 1, border: '1px solid', borderColor: isAllowed ? 'oklch(0.78 0.14 155)' : 'var(--surface-border)', background: isAllowed ? 'oklch(0.78 0.14 155)' : 'transparent', color: isAllowed ? '#fff' : 'var(--muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s', fontWeight: 700 }} title="Ideal for this use">✓</Box>
                                        <Box component="button" type="button" onClick={() => toggle('disallowed')} sx={{ width: 26, height: 26, borderRadius: 1, border: '1px solid', borderColor: isDisallowed ? 'oklch(0.72 0.18 25)' : 'var(--surface-border)', background: isDisallowed ? 'oklch(0.72 0.18 25)' : 'transparent', color: isDisallowed ? '#fff' : 'var(--muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s', fontWeight: 700 }} title="Not preferred">✕</Box>
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                              {(fAllowed.value.length > 0 || fDisallowed.value.length > 0) && (
                                <Box sx={{ mt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                  {fAllowed.value.length > 0 && (
                                    <Typography variant="caption" sx={{ color: 'oklch(0.78 0.14 155)', fontSize: 11 }}>
                                      {t('summaryIdeal')} {fAllowed.value.join(', ')}
                                    </Typography>
                                  )}
                                  {fDisallowed.value.length > 0 && (
                                    <Typography variant="caption" sx={{ color: 'oklch(0.72 0.18 25)', fontSize: 11 }}>
                                      {t('summaryNotPreferred')} {fDisallowed.value.join(', ')}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          )}
                        />
                      )}
                    />

                  </Box>

                </Box>

                {submitError && (
                  <Typography variant="body2" color="error" sx={{ mt: 3, fontFamily: "'DM Mono', monospace" }}>
                    {submitError}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 4, borderTop: '1px solid #1e1e3e' }}>
                  <Button type="button" variant="outlined" onClick={handleBack} disabled={activeStep === 0} sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}>{t('btnPrevious')}</Button>
                  {activeStep < steps.length - 1 ? (
                    <Button type="button" variant="contained" onClick={handleNext}>{t('btnNext')}</Button>
                  ) : (
                    <Button variant="contained" type="submit" disabled={uploading} startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : null}>
                      {uploading ? t('btnSaving') : t('btnRegister')}
                    </Button>
                  )}
                </Box>
              </form>
            </Card>
          )}

        </Box>
      </Box>
    </ThemeProvider>
  );
}
