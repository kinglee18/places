"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import {
  ThemeProvider, createTheme, Box, Typography, Button, Stepper, Step, StepLabel,
  TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Grid, Card,
  CircularProgress, IconButton, Autocomplete,
} from "@mui/material";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 280, borderRadius: '12px', bgcolor: '#0e0e22', border: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" color="text.secondary">Cargando mapa...</Typography>
    </Box>
  )
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00f5a0' },
    secondary: { main: '#00b4d8' },
    background: { default: '#0a0a14', paper: '#0e0e22' },
    text: { primary: '#e0e0ff', secondary: '#8888aa' },
    error: { main: '#ff6b6b' },
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
          backgroundColor: '#12122a',
          '& fieldset': { borderColor: '#2a2a4a' },
          '&:hover fieldset': { borderColor: '#444466' },
          '&.Mui-focused fieldset': { borderColor: '#00f5a0' },
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontFamily: "'DM Mono', monospace", color: '#8888aa', fontSize: '14px' }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: '12px 24px' },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00f5a0, #00b4d8)',
          color: '#0a0a14',
          '&:hover': { opacity: 0.9, transform: 'scale(1.02)' },
          transition: 'all 0.2s',
        },
        outlined: {
          borderColor: '#2a2a4a',
          color: '#e0e0ff',
          '&:hover': { backgroundColor: '#1a1a2e', borderColor: '#444466' }
        }
      }
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: '#0e0e22',
          border: '2px solid #2a2a4a',
          borderRadius: '50%',
          '&.Mui-active': { color: '#0e0e22', border: '2px solid #00f5a0' },
          '&.Mui-completed': { color: '#00f5a0', border: 'none' }
        },
        text: { fill: '#555577', fontFamily: "'Syne', sans-serif", fontWeight: 800 },
      }
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontFamily: "'DM Mono', monospace", color: '#666688', '&.Mui-active': { color: '#e0e0ff', fontWeight: 700 } }
      }
    }
  }
});


const TIPOS_LOCAL = [
  "Street-facing (with storefront)",
  "Inside commercial plaza",
  "Corner unit",
  "Basement / Semi-basement",
  "Market stall"
];

interface FormData {
  colonia: string; calle: string; numero: string;
  descripcion: string;
  tipoLocal: string; m2: number | ''; antiguedad: number | '';
  nivelPiso: string; usoAnterior: string;
  aguaDrenaje: string; habitaciones: number; banos: number; estacionamientos: number;
  modalidad: string; precioInmueble: string; precioMantenimiento: string;
}

const NIVELES_PISO = [
  'Ground floor (street level)',
  'Mezzanine',
  '2nd floor',
  '3rd floor or above',
  'Basement / semi-basement',
];

const USOS_ANTERIORES = [
  'Restaurant / food service',
  'Retail / store',
  'Office',
  'Gym / wellness',
  'Beauty / salon',
  'Medical / clinic',
  'Warehouse',
  'Vacant (never used)',
  'Other',
];

interface PinLocation { lat: number; lng: number; }

// ── NumberStepper ──────────────────────────────────────────────
function NumberStepper({ label, value, onChange, min = 0, max = 99 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const btnStyle: React.CSSProperties = {
    width: 34, height: 34, border: '1px solid #2a2a4a',
    borderRadius: 8, background: '#12122a', color: '#00f5a0',
    fontSize: 20, lineHeight: 1, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.15s', fontFamily: "'Syne', sans-serif",
    userSelect: 'none' as const,
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", color: '#8888aa', fontSize: 13, letterSpacing: 1 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#12122a', border: '1px solid #2a2a4a', borderRadius: 8, padding: '6px 12px', height: 50 }}>
        <button type="button" style={btnStyle} onClick={() => onChange(Math.max(min, value - 1))}
          onMouseEnter={e => (e.currentTarget.style.background = '#1a1a3a')}
          onMouseLeave={e => (e.currentTarget.style.background = '#12122a')}>−</button>
        <span style={{ flex: 1, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: '#e0e0ff' }}>{value}</span>
        <button type="button" style={btnStyle} onClick={() => onChange(Math.min(max, value + 1))}
          onMouseEnter={e => (e.currentTarget.style.background = '#1a1a3a')}
          onMouseLeave={e => (e.currentTarget.style.background = '#12122a')}>+</button>
      </div>
    </div>
  );
}

const steps = ['Location', 'Features', 'Details'];

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

export default function LocalIQ() {
  const { data: session } = useSession();
  const router = useRouter();
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (!res.ok) return;
      const addr = await res.json();
      setPinAddress(addr);
    } catch { /* non-blocking */ }
  }, []);

  const { control, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      colonia: '', calle: '', numero: '',
      descripcion: '',
      tipoLocal: '', m2: '', antiguedad: '',
      nivelPiso: '', usoAnterior: '',
      aguaDrenaje: '', habitaciones: 0, banos: 0, estacionamientos: 0,
      modalidad: '', precioInmueble: '', precioMantenimiento: '',
    },
    mode: 'onTouched'
  });

  const watchModalidad = watch('modalidad');

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
    // reset input so same file can be re-selected if removed
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
    if (photos.length < 5) {
      setPhotoError(`Please add ${5 - photos.length} more photo${5 - photos.length === 1 ? '' : 's'}.`);
      return;
    }
    setPhotoError(null);
    setSubmitError(null);
    setUploading(true);

    // ── 1. Upload photos ──────────────────────────────────────────────────
    const photoUrls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split('.').pop();
      const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(storagePath, file, { contentType: file.type });
      if (uploadError) {
        setSubmitError('Could not upload one or more photos. Please try again.');
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(storagePath);
      photoUrls.push(urlData.publicUrl);
    }

    // ── 3. Insert property ────────────────────────────────────────────────
    const { data: inserted, error } = await supabase
      .from('properties')
      .insert({
        user_email: session?.user?.email ?? 'anonymous',
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
      })
      .select('id')
      .single();

    setUploading(false);

    if (error) {
      setSubmitError('Could not save the property. Please try again.');
      return;
    }

    // Show success immediately; run competition analysis in background
    setSubmitted(true);

    // ── 4. Nearby competition analysis ────────────────────────────────────
    if (pinLocation) {
      setAnalyzingLocation(true);
      try {
        const nearbyRes = await fetch('/api/nearby-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pinLocation.lat, lng: pinLocation.lng, tipoLocal: data.tipoLocal }),
        });
        if (nearbyRes.ok) {
          const competition = await nearbyRes.json() as CompetitionData;
          if (inserted?.id) {
            await supabase
              .from('properties')
              .update({ competition_data: competition })
              .eq('id', inserted.id);
          }
        }
      } catch { /* analysis is non-blocking */ }
      setAnalyzingLocation(false);
    }

    router.push(`/propiedades/${inserted.id}`);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400&display=swap');
        .grid-bg { background-image: linear-gradient(#1a1a3a 1px, transparent 1px), linear-gradient(90deg, #1a1a3a 1px, transparent 1px); background-size: 40px 40px; }
      `}</style>

      <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", bgcolor: 'background.default', color: 'text.primary', pb: 10 }}>
        {/* Decorative elements */}
        <Box className="grid-bg" sx={{ position: "fixed", inset: 0, opacity: 0.3, pointerEvents: "none", zIndex: 0 }} />
        <Box sx={{ position: "fixed", top: -200, right: -200, width: 600, height: 600, background: "radial-gradient(circle, rgba(0,245,160,0.06) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />
        <Box sx={{ position: "fixed", bottom: -200, left: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(0,180,216,0.06) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

        <Box sx={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <Box mb={6}>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <Box sx={{ width: 32, height: 32, background: "linear-gradient(135deg, #00f5a0, #00b4d8)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📍</Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                Local<span style={{ color: "#00f5a0" }}>IQ</span>
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">Commercial property registration</Typography>
          </Box>

          {/* ── LOADING / REDIRECT STATE ── */}
          {submitted ? (
            <Box py={10} textAlign="center">
              <CircularProgress size={44} sx={{ color: '#00f5a0', mb: 3 }} />
              <Typography variant="h6" fontWeight={700} mb={1}>¡Propiedad registrada!</Typography>
              <Typography variant="body2" color="text.secondary">
                {analyzingLocation ? 'Analizando negocios cercanos...' : 'Redirigiendo a tu anuncio...'}
              </Typography>
            </Box>
          ) : (
            /* ── FORM STATE ── */
            <Card elevation={0} sx={{ border: "1px solid #1e1e3e", borderRadius: 4, pt: 4, pb: 5, px: { xs: 3, md: 5 } }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Register your property</Typography>
              <Typography variant="body2" color="text.secondary" mb={5} sx={{ lineHeight: 1.6 }}>
                Complete your commercial property details to publish it on the platform.
              </Typography>

              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6, '& .MuiStepConnector-line': { borderColor: '#2a2a4a' } }}>
                {steps.map((label) => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ minHeight: 240, display: 'flex', flexDirection: 'column', gap: 3 }}>

                  {/* STEP 1: UBICACIÓN */}
                  <Box sx={{ display: activeStep === 0 ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}>
                    <Controller name="colonia" control={control} rules={{ required: "Neighborhood / district required" }} render={({ field }) => (
                      <FormControl fullWidth error={!!errors.colonia}>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>NEIGHBORHOOD / DISTRICT *</InputLabel>
                        <Autocomplete
                          freeSolo
                          options={locationOptions}
                          getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                          loading={locationLoading}
                          inputValue={field.value}
                          onInputChange={(_, val) => { field.onChange(val); searchLocation(val); }}
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
                              placeholder="Search neighborhood, district, city..."
                              error={!!errors.colonia}
                              InputProps={{ ...params.InputProps, endAdornment: (<>{locationLoading ? <CircularProgress size={16} sx={{ color: '#00f5a0' }} /> : null}{params.InputProps.endAdornment}</>) }}
                            />
                          )}
                        />
                        {errors.colonia && <FormHelperText>{errors.colonia.message}</FormHelperText>}
                      </FormControl>
                    )} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Controller name="calle" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>STREET <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                            <TextField {...field} placeholder="Ex: Av. Insurgentes Sur" />
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name="numero" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>NUMBER <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                            <TextField {...field} placeholder="Ex: 123" />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    {/* Map pin */}
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: pinError ? '#ff6b6b' : '#8888aa', letterSpacing: 1, fontSize: 13 }}>
                          MAP LOCATION *
                        </Typography>
                      </Box>
                      <Box sx={{ borderRadius: '12px', outline: pinError ? '1.5px solid #ff6b6b' : 'none' }}>
                        <MapPicker
                          onLocationSelect={(lat, lng) => { setPinLocation({ lat, lng }); setPinError(false); reverseGeocode(lat, lng); }}
                          initialLat={pinLocation?.lat}
                          initialLng={pinLocation?.lng}
                          flyTo={mapFlyTo}
                        />
                      </Box>
                      {pinError ? (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, fontFamily: "'DM Mono', monospace" }}>
                          Please place a pin on the map to continue.
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontFamily: "'DM Mono', monospace" }}>
                          Click on the map to place the pin · you can drag it to adjust
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* STEP 2: CARACTERÍSTICAS */}
                  <Box sx={{ display: activeStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}>
                    <Controller name="tipoLocal" control={control} rules={{ required: "Type required" }} render={({ field }) => (
                      <FormControl fullWidth error={!!errors.tipoLocal}>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>PROPERTY TYPE *</InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="" disabled>Select property type</MenuItem>
                          {TIPOS_LOCAL.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                        {errors.tipoLocal && <FormHelperText>{errors.tipoLocal.message}</FormHelperText>}
                      </FormControl>
                    )} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller name="m2" control={control} rules={{ required: "Size required", min: 1 }} render={({ field }) => (
                          <FormControl fullWidth error={!!errors.m2}>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>SIZE (m²) *</InputLabel>
                            <TextField {...field} type="number" placeholder="Ex: 45" />
                            {errors.m2 && <FormHelperText>{errors.m2.message}</FormHelperText>}
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="antiguedad" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>AGE (YEARS)</InputLabel>
                            <TextField {...field} type="number" placeholder="Ex: 10" />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    <Controller name="nivelPiso" control={control} rules={{ required: "Floor level required" }} render={({ field }) => (
                      <FormControl fullWidth error={!!errors.nivelPiso}>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>FLOOR LEVEL *</InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="" disabled>Select floor level...</MenuItem>
                          {NIVELES_PISO.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                        </Select>
                        {errors.nivelPiso && <FormHelperText>{errors.nivelPiso.message}</FormHelperText>}
                      </FormControl>
                    )} />

                    <Controller name="usoAnterior" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>LAST USE <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">Select last use...</MenuItem>
                          {USOS_ANTERIORES.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )} />
                  </Box>

                  {/* STEP 3: DETALLES */}
                  <Box sx={{ display: activeStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}>

                    {/* Photo upload */}
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: '#8888aa', letterSpacing: 1, fontSize: 13 }}>
                          PHOTOS *
                        </Typography>
                        <Typography component="span" variant="caption" sx={{ color: photos.length === 5 ? '#00f5a0' : '#8888aa', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                          {photos.length} / 5
                        </Typography>
                      </Box>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handlePhotoAdd}
                      />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {photoPreviews.map((src, i) => (
                          <Box key={i} sx={{ position: 'relative', width: 90, height: 90, borderRadius: 2, overflow: 'hidden', border: '1px solid #2a2a4a', flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`photo-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <IconButton
                              size="small"
                              onClick={() => handlePhotoRemove(i)}
                              sx={{
                                position: 'absolute', top: 2, right: 2,
                                bgcolor: 'rgba(10,10,20,0.75)', color: '#ff6b6b',
                                width: 22, height: 22, fontSize: 14,
                                '&:hover': { bgcolor: 'rgba(10,10,20,0.95)' },
                              }}
                            >×</IconButton>
                          </Box>
                        ))}
                        {photos.length < 5 && (
                          <Box
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                              width: 90, height: 90, borderRadius: 2,
                              border: '1px dashed #2a2a4a', cursor: 'pointer',
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', gap: 0.5,
                              color: '#555577', flexShrink: 0,
                              '&:hover': { borderColor: '#00f5a0', color: '#00f5a0' },
                              transition: 'all 0.15s',
                            }}
                          >
                            <Typography sx={{ fontSize: 24, lineHeight: 1 }}>+</Typography>
                            <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>Add photo</Typography>
                          </Box>
                        )}
                      </Box>
                      {photoError && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontFamily: "'DM Mono', monospace" }}>
                          {photoError}
                        </Typography>
                      )}
                    </Box>

                    {/* Descripción libre */}
                    <Controller name="descripcion" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>DESCRIPTION <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                        <TextField {...field} multiline rows={3} placeholder="Describe the property: layout, general condition, special features..." />
                      </FormControl>
                    )} />

                    {/* Agua y drenaje */}
                    <Controller name="aguaDrenaje" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>WATER AND DRAINAGE <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">Select an option...</MenuItem>
                          <MenuItem value="Water and drainage complete">Water and drainage complete</MenuItem>
                          <MenuItem value="Water only">Water only</MenuItem>
                          <MenuItem value="Drainage only">Drainage only</MenuItem>
                          <MenuItem value="No connections">No connections</MenuItem>
                        </Select>
                      </FormControl>
                    )} />

                    {/* Steppers numéricos */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Controller name="habitaciones" control={control} render={({ field }) => (
                          <NumberStepper label="ROOMS" value={field.value as number} onChange={field.onChange} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name="banos" control={control} render={({ field }) => (
                          <NumberStepper label="BATHROOMS" value={field.value as number} onChange={field.onChange} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name="estacionamientos" control={control} render={({ field }) => (
                          <NumberStepper label="PARKING SPACES" value={field.value as number} onChange={field.onChange} />
                        )} />
                      </Grid>
                    </Grid>

                    {/* Modalidad + Precios */}
                    <Controller name="modalidad" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>LISTING TYPE <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">Not specified</MenuItem>
                          <MenuItem value="sale">For sale</MenuItem>
                          <MenuItem value="rent">For rent</MenuItem>
                        </Select>
                      </FormControl>
                    )} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller name="precioInmueble" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>
                              {watchModalidad === 'rent' ? 'MONTHLY RENT (MXN)' : watchModalidad === 'sale' ? 'SALE PRICE (MXN)' : 'PRICE (MXN)'}
                              {' '}<Typography component="span" variant="caption" color="text.secondary">(optional)</Typography>
                            </InputLabel>
                            <TextField
                              {...field}
                              type="number"
                              placeholder={watchModalidad === 'rent' ? 'Ex: 15000' : 'Ex: 2500000'}
                              InputProps={{ startAdornment: <Typography variant="body2" color="text.secondary" mr={0.5}>$</Typography> }}
                            />
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="precioMantenimiento" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>MONTHLY MAINTENANCE (MXN) <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                            <TextField
                              {...field}
                              type="number"
                              placeholder="Ex: 3500"
                              InputProps={{ startAdornment: <Typography variant="body2" color="text.secondary" mr={0.5}>$</Typography> }}
                            />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                  </Box>

                </Box>

                {submitError && (
                  <Typography variant="body2" color="error" sx={{ mt: 3, fontFamily: "'DM Mono', monospace" }}>
                    {submitError}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 4, borderTop: '1px solid #1e1e3e' }}>
                  <Button type="button" variant="outlined" onClick={handleBack} disabled={activeStep === 0} sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}>← Previous</Button>
                  {activeStep < steps.length - 1 ? (
                    <Button type="button" variant="contained" onClick={handleNext}>Next →</Button>
                  ) : (
                    <Button variant="contained" type="submit" disabled={uploading} startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : null}>
                      {uploading ? 'Saving...' : 'Register Property →'}
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
