"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { 
  ThemeProvider, createTheme, Box, Typography, Button, Stepper, Step, StepLabel,
  TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, CircularProgress,
  Card, CardContent, Chip, Grid
} from "@mui/material";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false, loading: () => (
  <Box sx={{ height: 280, borderRadius: '12px', bgcolor: '#0e0e22', border: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="caption" color="text.secondary">Cargando mapa...</Typography>
  </Box>
) });

// Custom dark theme to match previous design aesthetics
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00f5a0',
    },
    secondary: {
      main: '#00b4d8',
    },
    background: {
      default: '#0a0a14',
      paper: '#0e0e22',
    },
    text: {
      primary: '#e0e0ff',
      secondary: '#8888aa',
    },
    error: {
      main: '#ff6b6b'
    }
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
          '& fieldset': { borderColor: '#2a2a4a', },
          '&:hover fieldset': { borderColor: '#444466', },
          '&.Mui-focused fieldset': { borderColor: '#00f5a0', },
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

const COLONIAS_CDMX = [
  "Condesa", "Roma Norte", "Roma Sur", "Polanco", "Coyoacán", "Del Valle",
  "Narvarte", "Doctores", "Centro Histórico", "Tepito", "Pedregal", "Satélite",
  "Santa Fe", "Lomas de Chapultepec", "Peralvillo", "Guerrero", "Tepeyac",
  "Iztapalapa", "Xochimilco", "Tlalpan"
];

const TIPOS_LOCAL = [
  "Pie de calle (con vitrina)",
  "Interior de plaza comercial",
  "Esquina",
  "Sótano / Semisótano",
  "Local en mercado"
];

const MOCK_NEARBY = [
  { tipo: "Cafetería", cantidad: 4, radio: "300m" },
  { tipo: "Farmacia", cantidad: 2, radio: "400m" },
  { tipo: "Restaurante", cantidad: 7, radio: "500m" },
  { tipo: "Tienda de conveniencia", cantidad: 3, radio: "200m" },
];

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 10);
    return () => clearInterval(interval);
  }, [text]);
  return (
    <span>
      {displayed}
      {!done && <span style={{ animation: 'blink 1s step-end infinite' }}>▌</span>}
    </span>
  );
}

function ScoreBar({ score, color }: { score: number, color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(timer);
  }, [score]);
  return (
    <Box sx={{ background: "#1a1a2e", borderRadius: 1, height: 6, overflow: "hidden", flex: 1 }}>
      <Box sx={{ width: `${width}%`, height: "100%", background: color, borderRadius: 1, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
    </Box>
  );
}

interface Recomendacion {
  giro: string; score: number; razon_principal: string; demanda: number; competencia: number; potencial_renta: string;
}

interface ResultData {
  top_recomendaciones: Recomendacion[]; alerta: string; oportunidad_clave: string; perfil_zona: string;
}

interface FormData {
  colonia: string; calle: string; numero: string;
  descripcion: string;
  tipoLocal: string; m2: number | ''; antiguedad: number | '';
  aguaDrenaje: string; habitaciones: number; banos: number; estacionamientos: number;
  precioInmueble: string; precioMantenimiento: string;
}

interface PinLocation { lat: number; lng: number; }

// ── NumberStepper ─────────────────────────────────────────────
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

const steps = ['Ubicación', 'Características', 'Detalles'];

export default function LocalIQ() {
  const [appState, setAppState] = useState<"input" | "loading" | "result">("input");
  const [activeStep, setActiveStep] = useState(0);
  const [pinLocation, setPinLocation] = useState<PinLocation | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dots, setDots] = useState("");
  const dotsRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (appState === "loading") {
      dotsRef.current = setInterval(() => {
        setDots(d => d.length >= 3 ? "" : d + ".");
      }, 400);
    } else {
      if (dotsRef.current) clearInterval(dotsRef.current);
      setDots("");
    }
    return () => {
      if (dotsRef.current) clearInterval(dotsRef.current);
    }
  }, [appState]);
  
  const { control, handleSubmit, trigger, reset: resetForm, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      colonia: '', calle: '', numero: '',
      descripcion: '',
      tipoLocal: '', m2: '', antiguedad: '',
      aguaDrenaje: '', habitaciones: 0, banos: 0, estacionamientos: 0,
      precioInmueble: '', precioMantenimiento: '',
    },
    mode: 'onTouched'
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (activeStep === 0) fieldsToValidate = ['colonia'];
    if (activeStep === 1) fieldsToValidate = ['tipoLocal', 'm2'];

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const onSubmit = async (data: FormData) => {
    setAppState("loading");
    setApiError(null);

    const prompt = `Eres un experto en análisis de mercado inmobiliario-comercial en Ciudad de México. 
    Un emprendedor busca abrir un negocio en la colonia ${data.colonia}, CDMX.
    Dirección: ${data.calle ? data.calle + ' ' + (data.numero || '') : 'No especificada'}
    ${pinLocation ? `Coordenadas GPS del local: ${pinLocation.lat.toFixed(5)}, ${pinLocation.lng.toFixed(5)}` : ""}
    ${data.tipoLocal ? `Tipo de local: ${data.tipoLocal}` : ""}
    ${data.m2 ? `Metros cuadrados aproximados: ${data.m2}m²` : ""}
    ${data.antiguedad ? `Antigüedad: ${data.antiguedad} años` : ""}
    ${data.descripcion ? `Descripción del local: ${data.descripcion}` : ""}
    ${data.aguaDrenaje ? `Conexiones de agua y drenaje: ${data.aguaDrenaje}` : ""}
    ${data.habitaciones > 0 ? `Número de habitaciones/cuartos: ${data.habitaciones}` : ""}
    ${data.banos > 0 ? `Baños: ${data.banos}` : ""}
    ${data.estacionamientos > 0 ? `Estacionamientos: ${data.estacionamientos}` : ""}
    ${data.precioInmueble ? `Precio del inmueble: $${data.precioInmueble} MXN` : ""}
    ${data.precioMantenimiento ? `Precio de mantenimiento mensual: $${data.precioMantenimiento} MXN` : ""}
    Negocios cercanos en la zona: ${MOCK_NEARBY.map(n => `${n.cantidad} ${n.tipo} en radio de ${n.radio}`).join(", ")}.

    Responde SOLO con un JSON válido sin markdown, estructura:
    { "top_recomendaciones": [{ "giro": "str", "score": num, "razon_principal": "str", "demanda": num, "competencia": num, "potencial_renta": "bajo|medio|alto|muy alto" }], "alerta": "str", "oportunidad_clave": "str", "perfil_zona": "str" }`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const resData = await response.json();
      const raw = resData.content?.map((b: any) => b.text || "").join("").trim();
      setResult(JSON.parse(raw.replace(/```json|```/g, "").trim()));
      setAppState("result");
    } catch (e) {
      setApiError("Error al analizar. Verifica tu conexión e intenta de nuevo.");
      setAppState("input");
    }
  };

  const startNew = () => {
    setAppState("input"); setActiveStep(0); setResult(null); setApiError(null); resetForm(); setPinLocation(null);
  };

  const scoreColor = (s: number) => s >= 75 ? "#00f5a0" : s >= 50 ? "#f5c518" : "#ff6b6b";
  const compColor = (s: number) => s >= 70 ? "#ff6b6b" : s >= 40 ? "#f5c518" : "#00f5a0";

  return (
    <ThemeProvider theme={darkTheme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400&display=swap');
        @keyframes blink { 50% { opacity: 0; } }
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
              <Chip label="CDMX · beta" size="small" sx={{ bgcolor: '#1a1a3a', border: '1px solid #2a2a5a', color: '#8888cc', fontFamily: "'DM Mono', monospace", height: 20, fontSize: 10 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">inteligencia de negocio para locales comerciales</Typography>
          </Box>

          {/* INPUT STEP */}
          {appState === "input" && (
            <Card elevation={0} sx={{ border: "1px solid #1e1e3e", borderRadius: 4, pt: 4, pb: 5, px: { xs: 3, md: 5 } }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Registra tu propiedad</Typography>
              <Typography variant="body2" color="text.secondary" mb={5} sx={{ lineHeight: 1.6 }}>Completa los datos de tu local comercial. La IA evaluará el potencial de la zona y te recomendará los mejores giros de negocio.</Typography>

              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6, '& .MuiStepConnector-line': { borderColor: '#2a2a4a' } }}>
                {steps.map((label) => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ minHeight: 240, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  
                  {/* STEP 1: UBICACIÓN */}
                  <Box sx={{ display: activeStep === 0 ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}>
                    <Controller name="colonia" control={control} rules={{ required: "Colonia requerida" }} render={({ field }) => (
                      <FormControl fullWidth error={!!errors.colonia}>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>COLONIA *</InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="" disabled>Selecciona una colonia...</MenuItem>
                          {COLONIAS_CDMX.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        {errors.colonia && <FormHelperText>{errors.colonia.message}</FormHelperText>}
                      </FormControl>
                    )} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Controller name="calle" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>CALLE <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography></InputLabel>
                            <TextField {...field} placeholder="Ej: Av. Insurgentes Sur" />
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name="numero" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>NÚM. <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography></InputLabel>
                            <TextField {...field} placeholder="Ej: 123" />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                    {/* Map pin */}
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: '#8888aa', letterSpacing: 1, fontSize: 13 }}>
                          UBICACIÓN EN EL MAPA
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography>
                      </Box>
                      <MapPicker
                        onLocationSelect={(lat, lng) => setPinLocation({ lat, lng })}
                        initialLat={pinLocation?.lat}
                        initialLng={pinLocation?.lng}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontFamily: "'DM Mono', monospace" }}>
                        Haz clic en el mapa para colocar el pin · puedes arrastrarlo para ajustar
                      </Typography>
                    </Box>
                  </Box>

                  {/* STEP 2: CARACTERÍSTICAS */}
                  <Box sx={{ display: activeStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}>
                    <Controller name="tipoLocal" control={control} rules={{ required: "Tipo requerido" }} render={({ field }) => (
                      <FormControl fullWidth error={!!errors.tipoLocal}>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>TIPO DE LOCAL *</InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="" disabled>Selecciona el tipo de local</MenuItem>
                          {TIPOS_LOCAL.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                        {errors.tipoLocal && <FormHelperText>{errors.tipoLocal.message}</FormHelperText>}
                      </FormControl>
                    )} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller name="m2" control={control} rules={{ required: "Superficie requerida", min: 1 }} render={({ field }) => (
                          <FormControl fullWidth error={!!errors.m2}>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>SUPERFICIE (m²) *</InputLabel>
                            <TextField {...field} type="number" placeholder="Ej: 45" />
                            {errors.m2 && <FormHelperText>{errors.m2.message}</FormHelperText>}
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="antiguedad" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>ANTIGÜEDAD (AÑOS)</InputLabel>
                            <TextField {...field} type="number" placeholder="Ej: 10" />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* STEP 3: DETALLES */}
                  <Box sx={{ display: activeStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: 3 }}>

                    {/* Descripción libre */}
                    <Controller name="descripcion" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>DESCRIPCIÓN <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography></InputLabel>
                        <TextField {...field} multiline rows={3} placeholder="Describe el local: distribución, estado general, características especiales..." />
                      </FormControl>
                    )} />

                    {/* Agua y drenaje */}
                    <Controller name="aguaDrenaje" control={control} render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>CONEXIONES DE AGUA Y DRENAJE <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography></InputLabel>
                        <Select {...field} displayEmpty>
                          <MenuItem value="">Selecciona una opción...</MenuItem>
                          <MenuItem value="Agua y drenaje completos">Agua y drenaje completos</MenuItem>
                          <MenuItem value="Solo agua">Solo agua</MenuItem>
                          <MenuItem value="Solo drenaje">Solo drenaje</MenuItem>
                          <MenuItem value="Sin conexiones">Sin conexiones</MenuItem>
                        </Select>
                      </FormControl>
                    )} />

                    {/* Steppers numéricos */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Controller name="habitaciones" control={control} render={({ field }) => (
                          <NumberStepper label="HABITACIONES" value={field.value as number} onChange={field.onChange} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name="banos" control={control} render={({ field }) => (
                          <NumberStepper label="BAÑOS" value={field.value as number} onChange={field.onChange} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Controller name="estacionamientos" control={control} render={({ field }) => (
                          <NumberStepper label="ESTACIONAMIENTOS" value={field.value as number} onChange={field.onChange} />
                        )} />
                      </Grid>
                    </Grid>

                    {/* Precios */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller name="precioInmueble" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>PRECIO DEL INMUEBLE (MXN) <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography></InputLabel>
                            <TextField
                              {...field}
                              type="number"
                              placeholder="Ej: 2500000"
                              InputProps={{ startAdornment: <Typography variant="body2" color="text.secondary" mr={0.5}>$</Typography> }}
                            />
                          </FormControl>
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller name="precioMantenimiento" control={control} render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel shrink={false} sx={{ position: 'relative', transform: 'none', mb: 1 }}>MANTENIMIENTO MENSUAL (MXN) <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography></InputLabel>
                            <TextField
                              {...field}
                              type="number"
                              placeholder="Ej: 3500"
                              InputProps={{ startAdornment: <Typography variant="body2" color="text.secondary" mr={0.5}>$</Typography> }}
                            />
                          </FormControl>
                        )} />
                      </Grid>
                    </Grid>

                  </Box>
                  
                </Box>

                {apiError && (
                  <Box mt={2} p={1.5} borderRadius={2} bgcolor="#2a0a0a" border="1px solid #5a1a1a">
                    <Typography variant="caption" color="error.main">⚠ {apiError}</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 4, borderTop: '1px solid #1e1e3e' }}>
                  <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0} sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}>← Anterior</Button>
                  {activeStep < steps.length - 1 ? (
                    <Button variant="contained" onClick={handleNext}>Siguiente →</Button>
                  ) : (
                    <Button variant="contained" type="submit">Analizar con IA →</Button>
                  )}
                </Box>
              </form>
            </Card>
          )}

          {/* LOADING STEP */}
          {appState === "loading" && (
            <Box textAlign="center" py={10}>
              <CircularProgress size={64} sx={{ color: '#00f5a0', mb: 3 }} />
              <Typography variant="h6" fontWeight={700}>Analizando propiedad{dots}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, animation: 'pulse 2s infinite' }}>
                evaluando mercado · procesando zona · calculando oportunidades
              </Typography>
            </Box>
          )}

          {/* RESULT STEP */}
          {appState === "result" && result && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h5" fontWeight={800}>Análisis Completo</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    <TypingText text={result.perfil_zona} />
                  </Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={startNew}>← nuevo análisis</Button>
              </Box>

              {result.alerta && (
                <Box mb={2.5} p={2} borderRadius={2} bgcolor="#1a1000" border="1px solid #3a2800" display="flex" gap={1.5} alignItems="flex-start">
                  <Typography fontSize={20}>⚠️</Typography>
                  <Box>
                    <Typography variant="caption" color="#887722" fontWeight={700} letterSpacing={1}>ALERTA DE ZONA</Typography>
                    <Typography variant="body2" color="#ccaa44" mt={0.5}>{result.alerta}</Typography>
                  </Box>
                </Box>
              )}

              {result.oportunidad_clave && (
                <Box mb={4} p={2} borderRadius={2} bgcolor="#001a10" border="1px solid #003820" display="flex" gap={1.5} alignItems="flex-start">
                  <Typography fontSize={20}>💡</Typography>
                  <Box>
                    <Typography variant="caption" color="#228844" fontWeight={700} letterSpacing={1}>OPORTUNIDAD CLAVE</Typography>
                    <Typography variant="body2" color="#44cc88" mt={0.5}>{result.oportunidad_clave}</Typography>
                  </Box>
                </Box>
              )}

              <Box display="flex" flexDirection="column" gap={2}>
                {result.top_recomendaciones?.map((rec, i) => (
                  <Card key={i} elevation={0} sx={{ 
                    border: i === 0 ? "1px solid #00f5a044" : "1px solid #1e1e3e", 
                    borderRadius: 3, position: "relative", overflow: "visible",
                    transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" }
                  }}>
                    {i === 0 && (
                      <Chip label="TOP PICK" size="small" sx={{ position: "absolute", top: -10, right: 16, background: "linear-gradient(135deg, #00f5a0, #00b4d8)", color: "#0a0a14", fontWeight: 800, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, zIndex: 1 }} />
                    )}
                    <CardContent sx={{ p: 3, pb: "24px !important" }}>
                      <Box display="flex" alignItems="flex-start" gap={2} mb={2.5}>
                        <Box sx={{ width: 56, height: 56, borderRadius: 2, flexShrink: 0, background: `conic-gradient(${scoreColor(rec.score)} ${rec.score}%, #1a1a3a ${rec.score}%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: "background.paper", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: scoreColor(rec.score) }}>
                            {rec.score}
                          </Box>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="h6" fontSize={18} fontWeight={700} mb={0.5}>{rec.giro}</Typography>
                          <Typography variant="caption" color="text.secondary">{rec.razon_principal}</Typography>
                        </Box>
                        <Box sx={{
                          background: rec.potencial_renta === "muy alto" ? "#001a10" : rec.potencial_renta === "alto" ? "#001408" : "#0a0a20",
                          border: `1px solid ${rec.potencial_renta === "muy alto" ? "#005530" : rec.potencial_renta === "alto" ? "#003820" : "#2a2a4a"}`,
                          color: rec.potencial_renta === "muy alto" ? "#00cc66" : rec.potencial_renta === "alto" ? "#44cc88" : "#6688aa",
                          px: 1.5, py: 0.5, borderRadius: 1.5, textAlign: "center"
                        }}>
                          <Typography fontSize={9} mb={0.5} sx={{ opacity: 0.7 }} fontFamily="'DM Mono', monospace">RENTA</Typography>
                          <Typography fontSize={12} fontFamily="'DM Mono', monospace">{rec.potencial_renta}</Typography>
                        </Box>
                      </Box>
                      
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Typography variant="caption" color="text.secondary" sx={{ width: 80, flexShrink: 0 }}>demanda</Typography>
                          <ScoreBar score={rec.demanda} color="#00f5a0" />
                          <Typography variant="caption" color={scoreColor(rec.demanda)} sx={{ width: 28, textAlign: "right", fontWeight: 700 }}>{rec.demanda}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Typography variant="caption" color="text.secondary" sx={{ width: 80, flexShrink: 0 }}>saturación</Typography>
                          <ScoreBar score={rec.competencia} color={compColor(rec.competencia)} />
                          <Typography variant="caption" color={compColor(rec.competencia)} sx={{ width: 28, textAlign: "right", fontWeight: 700 }}>{rec.competencia}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <Typography variant="caption" display="block" textAlign="center" color="#333355" mt={4}>
                análisis generado por IA · datos orientativos · valida con investigación de campo
              </Typography>
            </Box>
          )}

        </Box>
      </Box>
    </ThemeProvider>
  );
}
