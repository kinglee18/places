"use client";

import { useState, useEffect } from "react";
import {
  ThemeProvider, createTheme, Box, Typography, Button, TextField,
  Card, CardContent, Chip, CircularProgress, Slider, FormControl,
  InputLabel, Select, MenuItem, Checkbox, FormControlLabel, FormGroup,
} from "@mui/material";

// ─── Tema oscuro (igual que LocalIQ) ────────────────────────────────────────
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00f5a0" },
    secondary: { main: "#00b4d8" },
    background: { default: "#0a0a14", paper: "#0e0e22" },
    text: { primary: "#e0e0ff", secondary: "#8888aa" },
    error: { main: "#ff6b6b" },
  },
  typography: {
    fontFamily: "'Syne', sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    body1: { fontFamily: "'DM Mono', monospace" },
    body2: { fontFamily: "'DM Mono', monospace" },
    button: { fontWeight: 700, textTransform: "none" },
    caption: { fontFamily: "'DM Mono', monospace" },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontFamily: "'DM Mono', monospace",
          borderRadius: 8,
          backgroundColor: "#12122a",
          "& fieldset": { borderColor: "#2a2a4a" },
          "&:hover fieldset": { borderColor: "#444466" },
          "&.Mui-focused fieldset": { borderColor: "#00f5a0" },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontFamily: "'DM Mono', monospace", color: "#8888aa", fontSize: "14px" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: "12px 24px" },
        containedPrimary: {
          background: "linear-gradient(135deg, #00f5a0, #00b4d8)",
          color: "#0a0a14",
          "&:hover": { opacity: 0.9, transform: "scale(1.02)" },
          transition: "all 0.2s",
        },
        outlined: {
          borderColor: "#2a2a4a",
          color: "#e0e0ff",
          "&:hover": { backgroundColor: "#1a1a2e", borderColor: "#444466" },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: { color: "#2a2a4a", "&.Mui-checked": { color: "#00f5a0" } },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: "#00f5a0" },
        rail: { backgroundColor: "#2a2a4a" },
        mark: { backgroundColor: "#2a2a4a" },
        markLabel: { fontFamily: "'DM Mono', monospace", color: "#8888aa", fontSize: 11 },
      },
    },
  },
});

// ─── Colonias CDMX ──────────────────────────────────────────────────────────
const COLONIAS_CDMX = [
  "Condesa", "Roma Norte", "Roma Sur", "Polanco", "Coyoacán", "Del Valle",
  "Narvarte", "Doctores", "Centro Histórico", "Tepito", "Pedregal",
  "Santa Fe", "Lomas de Chapultepec", "Guerrero", "Iztapalapa",
  "Xochimilco", "Tlalpan", "Peralvillo", "Tepeyac", "Satélite",
];

const DISPONIBILIDAD_OPTS = [
  { value: "tiempo_completo", label: "Tiempo completo" },
  { value: "fines_semana", label: "Fines de semana" },
  { value: "entre_semana", label: "Entre semana" },
  { value: "por_horas", label: "Por horas / turnos" },
];

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface ColoniaResult {
  nombre: string;
  razon: string;
  nivel_competencia: "bajo" | "medio" | "alto";
  nivel_oportunidad: number;
}

interface BuscarResult {
  giro_detectado: string;
  resumen_interpretacion: string;
  requisitos_espacio: {
    m2_minimo: number;
    m2_ideal: number;
    servicios_necesarios: string[];
    caracteristicas_deseables: string[];
  };
  colonias_recomendadas: ColoniaResult[];
  presupuesto_viable: boolean;
  mensaje_presupuesto: string;
  alertas: string[];
  consejos: string[];
}

// ─── ScoreBar animada ────────────────────────────────────────────────────────
function ScoreBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 150);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <Box sx={{ background: "#1a1a2e", borderRadius: 1, height: 6, overflow: "hidden", flex: 1 }}>
      <Box sx={{ width: `${width}%`, height: "100%", background: color, borderRadius: 1, transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)" }} />
    </Box>
  );
}

// ─── Badge de competencia ────────────────────────────────────────────────────
const compConfig = {
  bajo:  { bg: "#001a10", border: "#003820", color: "#44cc88", label: "baja competencia" },
  medio: { bg: "#1a1200", border: "#3a2800", color: "#ccaa44", label: "competencia media" },
  alto:  { bg: "#1a0808", border: "#3a1212", color: "#cc4444", label: "alta competencia" },
};

// ─── Ejemplos de descripción ─────────────────────────────────────────────────
const EJEMPLOS = [
  "Tengo una cafetera industrial, vitrinas refrigeradas y equipo para hacer repostería. Busco espacio los fines de semana.",
  "Soy estilista con mis propias tijeras, silla y espejos. Necesito un lugar entre semana para atender clientes.",
  "Tengo máquinas de coser y materiales para ropa a medida. Busco un espacio tranquilo con buena luz.",
];

// ─── Componente principal ────────────────────────────────────────────────────
export default function BuscarLocal() {
  const [appState, setAppState] = useState<"input" | "loading" | "result">("input");
  const [descripcion, setDescripcion] = useState("");
  const [zona, setZona] = useState("");
  const [presupuesto, setPresupuesto] = useState<number>(8000);
  const [disponibilidad, setDisponibilidad] = useState<string[]>([]);
  const [result, setResult] = useState<BuscarResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState("");

  // Animación de puntos en loading
  useEffect(() => {
    if (appState !== "loading") { setDots(""); return; }
    const interval = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => clearInterval(interval);
  }, [appState]);

  const toggleDisponibilidad = (val: string) => {
    setDisponibilidad((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleSubmit = async () => {
    if (descripcion.trim().length < 10) {
      setError("Describe un poco más tu situación (mínimo 10 caracteres).");
      return;
    }
    setError(null);
    setAppState("loading");

    try {
      const res = await fetch("/api/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion, zona, presupuesto, disponibilidad }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error desconocido");
      setResult(data);
      setAppState("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al analizar. Intenta de nuevo.");
      setAppState("input");
    }
  };

  const reset = () => {
    setAppState("input");
    setResult(null);
    setError(null);
    setDescripcion("");
    setZona("");
    setPresupuesto(8000);
    setDisponibilidad([]);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400&display=swap');
        .grid-bg { background-image: linear-gradient(#1a1a3a 1px, transparent 1px), linear-gradient(90deg, #1a1a3a 1px, transparent 1px); background-size: 40px 40px; }
        @keyframes fadein { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .fadein { animation: fadein 0.4s ease both; }
      `}</style>

      <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", bgcolor: "background.default", color: "text.primary", pb: 12 }}>
        {/* Fondo */}
        <Box className="grid-bg" sx={{ position: "fixed", inset: 0, opacity: 0.3, pointerEvents: "none", zIndex: 0 }} />
        <Box sx={{ position: "fixed", top: -200, left: -200, width: 600, height: 600, background: "radial-gradient(circle, rgba(0,180,216,0.07) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />
        <Box sx={{ position: "fixed", bottom: -200, right: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(0,245,160,0.07) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

        <Box sx={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <Box mb={6}>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <Box sx={{ width: 32, height: 32, background: "linear-gradient(135deg, #00b4d8, #00f5a0)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔍</Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                Local<span style={{ color: "#00f5a0" }}>IQ</span>
              </Typography>
              <Chip label="buscar · beta" size="small" sx={{ bgcolor: "#1a1a3a", border: "1px solid #2a2a5a", color: "#8888cc", fontFamily: "'DM Mono', monospace", height: 20, fontSize: 10 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">encuentra el espacio ideal para tu proyecto</Typography>
          </Box>

          {/* ── ESTADO: INPUT ───────────────────────────────────────────── */}
          {appState === "input" && (
            <Card elevation={0} sx={{ border: "1px solid #1e1e3e", borderRadius: 4, pt: 4, pb: 5, px: { xs: 3, md: 5 } }} className="fadein">

              <Typography variant="h6" fontWeight={700} mb={1}>¿Qué quieres hacer?</Typography>
              <Typography variant="body2" color="text.secondary" mb={4} sx={{ lineHeight: 1.7 }}>
                Cuéntanos tu situación con tus propias palabras. La IA detectará qué tipo de negocio quieres montar, qué espacio necesitas y las mejores zonas de CDMX para ti.
              </Typography>

              {/* Textarea principal */}
              <Box mb={1}>
                <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#8888aa", letterSpacing: 1, fontSize: 13, display: "block", mb: 1 }}>
                  DESCRIBE TU SITUACIÓN *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Tengo una cafetera industrial y equipo de repostería. Busco espacio los fines de semana para atender mis pedidos..."
                  inputProps={{ maxLength: 600 }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Cuanto más detalles, mejor será el análisis
                  </Typography>
                  <Typography variant="caption" color={descripcion.length > 500 ? "#f5c518" : "text.secondary"}>
                    {descripcion.length}/600
                  </Typography>
                </Box>
              </Box>

              {/* Ejemplos rápidos */}
              <Box mb={4} display="flex" gap={1} flexWrap="wrap">
                {EJEMPLOS.map((ej, i) => (
                  <Chip
                    key={i}
                    label={`Ejemplo ${i + 1}`}
                    size="small"
                    onClick={() => setDescripcion(ej)}
                    sx={{ bgcolor: "#12122a", border: "1px solid #2a2a4a", color: "#8888cc", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11, "&:hover": { borderColor: "#00f5a0", color: "#00f5a0" }, transition: "all 0.2s" }}
                  />
                ))}
              </Box>

              {/* Opciones adicionales */}
              <Box sx={{ background: "#0c0c1e", border: "1px solid #1a1a3a", borderRadius: 2, p: 3, mb: 4 }}>
                <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#555577", letterSpacing: 1, fontSize: 11, display: "block", mb: 3 }}>
                  OPCIONES ADICIONALES (opcional)
                </Typography>

                <Box display="flex" flexDirection="column" gap={3.5}>
                  {/* Zona */}
                  <FormControl fullWidth size="small">
                    <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1, fontSize: 13 }}>
                      ZONA PREFERIDA
                    </InputLabel>
                    <Select value={zona} onChange={(e) => setZona(e.target.value as string)} displayEmpty>
                      <MenuItem value="">La IA me recomienda una zona</MenuItem>
                      {COLONIAS_CDMX.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {/* Presupuesto */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#8888aa", letterSpacing: 1, fontSize: 13 }}>
                        PRESUPUESTO MENSUAL DE RENTA
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#00f5a0", fontWeight: 700 }}>
                        ${presupuesto.toLocaleString()} MXN
                      </Typography>
                    </Box>
                    <Slider
                      value={presupuesto}
                      onChange={(_, v) => setPresupuesto(v as number)}
                      min={2000}
                      max={50000}
                      step={500}
                      marks={[
                        { value: 2000, label: "$2k" },
                        { value: 15000, label: "$15k" },
                        { value: 30000, label: "$30k" },
                        { value: 50000, label: "$50k" },
                      ]}
                    />
                  </Box>

                  {/* Disponibilidad */}
                  <Box>
                    <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#8888aa", letterSpacing: 1, fontSize: 13, display: "block", mb: 1.5 }}>
                      ¿CUÁNDO NECESITAS EL ESPACIO?
                    </Typography>
                    <FormGroup row sx={{ gap: 1 }}>
                      {DISPONIBILIDAD_OPTS.map((opt) => (
                        <FormControlLabel
                          key={opt.value}
                          control={
                            <Checkbox
                              checked={disponibilidad.includes(opt.value)}
                              onChange={() => toggleDisponibilidad(opt.value)}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                              {opt.label}
                            </Typography>
                          }
                          sx={{ mr: 0 }}
                        />
                      ))}
                    </FormGroup>
                  </Box>
                </Box>
              </Box>

              {/* Error */}
              {error && (
                <Box mb={3} p={1.5} borderRadius={2} bgcolor="#2a0a0a" border="1px solid #5a1a1a">
                  <Typography variant="caption" color="error.main">⚠ {error}</Typography>
                </Box>
              )}

              <Button variant="contained" fullWidth size="large" onClick={handleSubmit}>
                Analizar con IA →
              </Button>
            </Card>
          )}

          {/* ── ESTADO: LOADING ─────────────────────────────────────────── */}
          {appState === "loading" && (
            <Box textAlign="center" py={12} className="fadein">
              <CircularProgress size={64} sx={{ color: "#00f5a0", mb: 3 }} />
              <Typography variant="h6" fontWeight={700}>Buscando tu espacio ideal{dots}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                interpretando tu perfil · analizando zonas · calculando compatibilidad
              </Typography>
            </Box>
          )}

          {/* ── ESTADO: RESULTADO ───────────────────────────────────────── */}
          {appState === "result" && result && (
            <Box className="fadein">
              {/* Cabecera de resultado */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4} flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h5" fontWeight={800}>Tu análisis de espacio</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    basado en tu descripción · orientativo
                  </Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={reset}>← nueva búsqueda</Button>
              </Box>

              {/* Giro detectado */}
              <Card elevation={0} sx={{ border: "1px solid #00f5a044", borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 3, pb: "24px !important" }}>
                  <Box display="flex" gap={1.5} alignItems="flex-start">
                    <Typography fontSize={28}>🤖</Typography>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#00f5a0", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
                        GIRO DETECTADO
                      </Typography>
                      <Typography variant="h6" fontWeight={700} mt={0.5} mb={1}>
                        {result.giro_detectado}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {result.resumen_interpretacion}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Requisitos del espacio */}
              <Card elevation={0} sx={{ border: "1px solid #1e1e3e", borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 3, pb: "24px !important" }}>
                  <Typography variant="caption" sx={{ color: "#00b4d8", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 2 }}>
                    📐 REQUISITOS DEL ESPACIO
                  </Typography>

                  <Box display="flex" gap={3} mb={3} flexWrap="wrap">
                    <Box sx={{ background: "#0c0c1e", border: "1px solid #1a1a3a", borderRadius: 2, px: 2.5, py: 1.5, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>mínimo</Typography>
                      <Typography fontWeight={800} fontSize={22} color="#00b4d8">{result.requisitos_espacio.m2_minimo}</Typography>
                      <Typography variant="caption" color="text.secondary">m²</Typography>
                    </Box>
                    <Box sx={{ background: "#0c0c1e", border: "1px solid #1a1a3a", borderRadius: 2, px: 2.5, py: 1.5, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>ideal</Typography>
                      <Typography fontWeight={800} fontSize={22} color="#00f5a0">{result.requisitos_espacio.m2_ideal}</Typography>
                      <Typography variant="caption" color="text.secondary">m²</Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>Servicios necesarios</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {result.requisitos_espacio.servicios_necesarios.map((s, i) => (
                        <Chip key={i} label={s} size="small" sx={{ bgcolor: "#001a10", border: "1px solid #003820", color: "#44cc88", fontFamily: "'DM Mono', monospace", fontSize: 11 }} />
                      ))}
                    </Box>
                  </Box>

                  {result.requisitos_espacio.caracteristicas_deseables.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>Deseables</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {result.requisitos_espacio.caracteristicas_deseables.map((c, i) => (
                          <Chip key={i} label={c} size="small" sx={{ bgcolor: "#12122a", border: "1px solid #2a2a4a", color: "#8888cc", fontFamily: "'DM Mono', monospace", fontSize: 11 }} />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Presupuesto */}
              {result.mensaje_presupuesto && (
                <Box mb={3} p={2} borderRadius={2}
                  bgcolor={result.presupuesto_viable ? "#001a10" : "#1a0808"}
                  border={`1px solid ${result.presupuesto_viable ? "#003820" : "#3a1212"}`}
                  display="flex" gap={1.5} alignItems="flex-start"
                >
                  <Typography fontSize={20}>{result.presupuesto_viable ? "✅" : "⚠️"}</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ color: result.presupuesto_viable ? "#228844" : "#cc4444", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
                      PRESUPUESTO
                    </Typography>
                    <Typography variant="body2" color={result.presupuesto_viable ? "#44cc88" : "#ff8888"} mt={0.5}>
                      {result.mensaje_presupuesto}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Colonias recomendadas */}
              <Typography variant="caption" sx={{ color: "#8888aa", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 2 }}>
                📍 COLONIAS RECOMENDADAS
              </Typography>
              <Box display="flex" flexDirection="column" gap={2} mb={3}>
                {result.colonias_recomendadas.map((col, i) => (
                  <Card key={i} elevation={0} sx={{ border: i === 0 ? "1px solid #00f5a044" : "1px solid #1e1e3e", borderRadius: 3, position: "relative", transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>
                    {i === 0 && (
                      <Chip label="MEJOR OPCIÓN" size="small" sx={{ position: "absolute", top: -10, right: 16, background: "linear-gradient(135deg, #00f5a0, #00b4d8)", color: "#0a0a14", fontWeight: 800, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1 }} />
                    )}
                    <CardContent sx={{ p: 3, pb: "24px !important" }}>
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} mb={2}>
                        <Typography variant="h6" fontSize={17} fontWeight={700}>{col.nombre}</Typography>
                        <Box sx={{ ...compConfig[col.nivel_competencia], px: 1.5, py: 0.5, borderRadius: 1.5, textAlign: "center", flexShrink: 0 }}>
                          <Typography fontSize={10} sx={{ opacity: 0.7, fontFamily: "'DM Mono', monospace" }}>{compConfig[col.nivel_competencia].label}</Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2} sx={{ lineHeight: 1.6 }}>
                        {col.razon}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="caption" color="text.secondary" sx={{ width: 90, flexShrink: 0 }}>oportunidad</Typography>
                        <ScoreBar score={col.nivel_oportunidad} color="#00f5a0" />
                        <Typography variant="caption" sx={{ color: "#00f5a0", width: 28, textAlign: "right", fontWeight: 700 }}>
                          {col.nivel_oportunidad}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Alertas */}
              {result.alertas.length > 0 && (
                <Box mb={3} p={2.5} borderRadius={2} bgcolor="#1a1000" border="1px solid #3a2800">
                  <Typography variant="caption" sx={{ color: "#887722", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 1.5 }}>
                    ⚠️ ALERTAS
                  </Typography>
                  {result.alertas.map((a, i) => (
                    <Typography key={i} variant="body2" color="#ccaa44" sx={{ lineHeight: 1.7 }}>· {a}</Typography>
                  ))}
                </Box>
              )}

              {/* Consejos */}
              {result.consejos.length > 0 && (
                <Box mb={4} p={2.5} borderRadius={2} bgcolor="#0a0a1e" border="1px solid #1e1e3e">
                  <Typography variant="caption" sx={{ color: "#00b4d8", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 1.5 }}>
                    💡 CONSEJOS PRÁCTICOS
                  </Typography>
                  {result.consejos.map((c, i) => (
                    <Typography key={i} variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>· {c}</Typography>
                  ))}
                </Box>
              )}

              <Typography variant="caption" display="block" textAlign="center" color="#333355">
                análisis generado por IA · datos orientativos · valida con investigación de campo
              </Typography>
            </Box>
          )}

        </Box>
      </Box>
    </ThemeProvider>
  );
}
