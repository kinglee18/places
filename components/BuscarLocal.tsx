"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  ThemeProvider, createTheme, Box, Typography, Button, TextField,
  Card, CardContent, Chip, CircularProgress, Slider, FormControl,
  ToggleButton, ToggleButtonGroup,
} from "@mui/material";

const ZonaPicker = dynamic(() => import("./ZonaPicker"), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 320, borderRadius: "12px", bgcolor: "#0e0e22", border: "1px solid #2a2a4a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography variant="caption" color="text.secondary">Loading map...</Typography>
    </Box>
  ),
});

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

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface ColoniaResult {
  nombre: string;
  razon: string;
  nivel_competencia: "bajo" | "medio" | "alto";
  nivel_oportunidad: number;
}

interface MatchingProperty {
  id: string;
  colonia: string;
  calle: string | null;
  numero: string | null;
  tipo_local: string;
  m2: number;
  agua_drenaje: string | null;
  modalidad: string | null;
  precio_inmueble: number | null;
  precio_mantenimiento: number | null;
  descripcion: string | null;
  photo_urls: string[];
  nivel_piso: string | null;
  banos: number;
  estacionamientos: number;
  match_score: number;
  match_reasons: string[];
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
  matching_properties: MatchingProperty[];
}

// ─── Preflight (paso 1) ──────────────────────────────────────────────────────
type Modalidad = "rent" | "sale" | "cualquiera";

interface PreflightProperty {
  id: string;
  colonia: string;
  calle: string | null;
  numero: string | null;
  tipo_local: string;
  m2: number;
  modalidad: string | null;
  precio_inmueble: number | null;
  precio_mantenimiento: number | null;
  photo_urls: string[];
  banos: number;
  estacionamientos: number;
  distance_km: number | null;
  budget_status: "within" | "over" | "unknown";
  saturacion: {
    competidores_500m: number;
    competidores_2km: number;
    nivel: "baja" | "media" | "alta";
  };
}

interface PreflightResult {
  giro_detectado: { id: string | null; label: string; emoji: string; source: "keyword" | "ai" | "unknown" };
  modalidad_filtro: Modalidad;
  geo_aplicado: boolean;
  radio_km: number | null;
  total_disponibles: number;
  properties_match: PreflightProperty[];
  necesita_analisis_ia: boolean;
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
type AppState = "input" | "preflight_loading" | "preflight" | "ai_loading" | "result";

export default function BuscarLocal() {
  const [appState, setAppState] = useState<AppState>("input");
  const [descripcion, setDescripcion] = useState("");
  const [zona, setZona] = useState<{ label: string; lat: number; lng: number } | null>(null);
  const [modalidad, setModalidad] = useState<Modalidad>("rent");
  const [presupuesto, setPresupuesto] = useState<number>(8000);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [result, setResult] = useState<BuscarResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState("");

  const isLoading = appState === "preflight_loading" || appState === "ai_loading";

  // Animación de puntos en loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => { clearInterval(interval); setDots(""); };
  }, [isLoading]);

  // ── Paso 1: preflight (DB + saturación) ────────────────────────────────────
  const handleSubmit = async () => {
    if (descripcion.trim().length < 10) {
      setError("Describe un poco más tu situación (mínimo 10 caracteres).");
      return;
    }
    setError(null);
    setAppState("preflight_loading");

    try {
      const res = await fetch("/api/buscar/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion,
          lat: zona?.lat ?? null,
          lng: zona?.lng ?? null,
          modalidad,
          presupuesto,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error desconocido");
      setPreflight(data);
      setAppState("preflight");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al buscar matches. Intenta de nuevo.");
      setAppState("input");
    }
  };

  // ── Paso 2: análisis IA completo (opcional) ────────────────────────────────
  const handleAiAnalysis = async () => {
    setError(null);
    setAppState("ai_loading");

    try {
      const res = await fetch("/api/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion,
          zona: zona?.label ?? null,
          lat: zona?.lat ?? null,
          lng: zona?.lng ?? null,
          presupuesto,
          modalidad,
          // Anclamos el análisis al giro ya detectado para mejor calidad y consistencia
          giro_pre_detectado: preflight?.giro_detectado.label ?? null,
          preflight_property_ids: preflight?.properties_match.map((p) => p.id) ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error desconocido");
      setResult(data);
      setAppState("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al analizar. Intenta de nuevo.");
      setAppState("preflight");
    }
  };

  const reset = () => {
    setAppState("input");
    setResult(null);
    setPreflight(null);
    setError(null);
    setDescripcion("");
    setZona(null);
    setModalidad("rent");
    setPresupuesto(8000);
  };

  const backToInput = () => {
    setAppState("input");
    setError(null);
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
                  <FormControl fullWidth>
                    <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#8888aa", letterSpacing: 1, fontSize: 13, display: "block", mb: 1.5 }}>
                      PREFERRED ZONE
                    </Typography>
                    <ZonaPicker onChange={setZona} />
                  </FormControl>

                  {/* Modalidad: renta / compra / cualquiera */}
                  <Box>
                    <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#8888aa", letterSpacing: 1, fontSize: 13, display: "block", mb: 1.5 }}>
                      ¿RENTA O COMPRA?
                    </Typography>
                    <ToggleButtonGroup
                      value={modalidad}
                      exclusive
                      onChange={(_, v) => { if (v) setModalidad(v as Modalidad); }}
                      size="small"
                      sx={{
                        "& .MuiToggleButton-root": {
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 12,
                          color: "#8888aa",
                          borderColor: "#2a2a4a",
                          textTransform: "none",
                          px: 2,
                          py: 0.7,
                          "&.Mui-selected": {
                            background: "rgba(0, 245, 160, 0.08)",
                            color: "#00f5a0",
                            borderColor: "rgba(0, 245, 160, 0.4)",
                            "&:hover": { background: "rgba(0, 245, 160, 0.12)" },
                          },
                        },
                      }}
                    >
                      <ToggleButton value="rent">Renta</ToggleButton>
                      <ToggleButton value="sale">Compra</ToggleButton>
                      <ToggleButton value="cualquiera">Cualquiera</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

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

          {/* ── ESTADO: PREFLIGHT LOADING ───────────────────────────────── */}
          {appState === "preflight_loading" && (
            <Box textAlign="center" py={12} className="fadein">
              <CircularProgress size={64} sx={{ color: "#00f5a0", mb: 3 }} />
              <Typography variant="h6" fontWeight={700}>Buscando matches{dots}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                detectando giro · revisando inventario · midiendo saturación
              </Typography>
            </Box>
          )}

          {/* ── ESTADO: AI LOADING ──────────────────────────────────────── */}
          {appState === "ai_loading" && (
            <Box textAlign="center" py={12} className="fadein">
              <CircularProgress size={64} sx={{ color: "#00f5a0", mb: 3 }} />
              <Typography variant="h6" fontWeight={700}>Análisis IA en curso{dots}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                interpretando tu perfil · analizando zonas · generando consejos
              </Typography>
            </Box>
          )}

          {/* ── ESTADO: PREFLIGHT (matches + saturación) ────────────────── */}
          {appState === "preflight" && preflight && (
            <Box className="fadein">
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h5" fontWeight={800}>Resultados rápidos</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    matches en inventario · sin IA todavía
                  </Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={backToInput}>← editar búsqueda</Button>
              </Box>

              {/* Giro detectado */}
              <Card elevation={0} sx={{ border: "1px solid #00f5a044", borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 2.5, pb: "20px !important" }}>
                  <Box display="flex" gap={1.5} alignItems="center">
                    <Typography fontSize={26}>{preflight.giro_detectado.emoji}</Typography>
                    <Box flex={1}>
                      <Typography variant="caption" sx={{ color: "#00f5a0", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
                        GIRO DETECTADO {preflight.giro_detectado.source === "ai" && "· vía ia"}
                        {preflight.giro_detectado.source === "keyword" && "· vía keywords"}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>{preflight.giro_detectado.label}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={preflight.modalidad_filtro === "rent" ? "Renta" : preflight.modalidad_filtro === "sale" ? "Compra" : "Cualquiera"}
                      sx={{ bgcolor: "#12122a", border: "1px solid #2a2a4a", color: "#8888cc", fontFamily: "'DM Mono', monospace", fontSize: 11 }}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Resumen */}
              <Box mb={3} p={2} borderRadius={2} bgcolor="#0a0a1e" border="1px solid #1e1e3e">
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {preflight.geo_aplicado
                    ? <>Encontramos <b style={{ color: "#00f5a0" }}>{preflight.properties_match.length}</b> local{preflight.properties_match.length !== 1 ? "es" : ""} en un radio de <b>{preflight.radio_km}km</b> de la zona elegida{preflight.modalidad_filtro !== "cualquiera" ? ` en modalidad ${preflight.modalidad_filtro === "rent" ? "renta" : "compra"}` : ""}.</>
                    : <>Mostrando <b style={{ color: "#00f5a0" }}>{preflight.properties_match.length}</b> local{preflight.properties_match.length !== 1 ? "es" : ""} disponibles{preflight.modalidad_filtro !== "cualquiera" ? ` en modalidad ${preflight.modalidad_filtro === "rent" ? "renta" : "compra"}` : ""}. <i style={{ color: "#8888aa" }}>(no seleccionaste zona — sin filtro de distancia)</i></>
                  }
                </Typography>
              </Box>

              {/* Sin matches */}
              {preflight.properties_match.length === 0 && (
                <Box mb={4} p={3} borderRadius={2} bgcolor="#1a0808" border="1px solid #3a1212" textAlign="center">
                  <Typography fontSize={32} mb={1}>📭</Typography>
                  <Typography variant="body2" color="#ff8888" fontWeight={700} mb={1}>
                    Sin inventario que coincida.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
                    {preflight.geo_aplicado
                      ? "No hay locales registrados en esa zona con esa modalidad. Prueba ampliando la zona, cambiando renta↔compra, o pide el análisis IA para conocer mejores colonias para tu giro."
                      : "Ningún local registrado coincide con esa modalidad. Cambia el filtro o pide el análisis IA."}
                  </Typography>
                  <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                    <Button variant="outlined" size="small" onClick={backToInput}>Editar búsqueda</Button>
                    <Button variant="contained" size="small" onClick={handleAiAnalysis}>Análisis IA →</Button>
                  </Box>
                </Box>
              )}

              {/* Lista de matches con saturación */}
              {preflight.properties_match.length > 0 && (
                <Box mb={4}>
                  <Typography variant="caption" sx={{ color: "#8888aa", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 2 }}>
                    🏠 LOCALES DISPONIBLES (ordenados por cercanía)
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {preflight.properties_match.map((p) => {
                      const sat = p.saturacion;
                      const satCfg = sat.nivel === "alta"
                        ? { bg: "#1a0808", border: "#3a1212", color: "#ff6b6b", icon: "⚠️", text: `Alta saturación: ${sat.competidores_500m} competidor${sat.competidores_500m !== 1 ? "es" : ""} a 500m, ${sat.competidores_2km} a 2km` }
                        : sat.nivel === "media"
                          ? { bg: "#1a1200", border: "#3a2800", color: "#ccaa44", icon: "⚡", text: `Saturación media: ${sat.competidores_500m} a 500m, ${sat.competidores_2km} a 2km` }
                          : { bg: "#001a10", border: "#003820", color: "#44cc88", icon: "✓", text: sat.competidores_2km > 0 ? `Baja: solo ${sat.competidores_2km} competidor${sat.competidores_2km !== 1 ? "es" : ""} a 2km` : "Zona libre de competidores directos" };

                      return (
                        <a
                          key={p.id}
                          href={`/propiedades/${p.id}`}
                          style={{ textDecoration: "none", color: "inherit", display: "block" }}
                        >
                          <Box sx={{
                            border: "1px solid #1e1e3e",
                            borderRadius: 3,
                            overflow: "hidden",
                            transition: "transform 0.2s, border-color 0.2s",
                            "&:hover": { transform: "translateY(-2px)", borderColor: "rgba(0,245,160,0.3)" },
                            cursor: "pointer",
                          }}>
                            <Box sx={{ display: "flex", gap: 0 }}>
                              {/* Foto */}
                              <Box sx={{
                                width: 110, flexShrink: 0,
                                background: "#0e0e22",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 28, opacity: 0.4, minHeight: 130,
                                position: "relative", overflow: "hidden",
                              }}>
                                {p.photo_urls?.length > 0 ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.photo_urls[0]}
                                    alt={p.colonia}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, opacity: 1 }}
                                  />
                                ) : "🏬"}
                              </Box>

                              {/* Info */}
                              <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                  <Box>
                                    <Typography fontWeight={700} fontSize={14}>{p.colonia}</Typography>
                                    {p.calle && (
                                      <Typography variant="caption" color="text.secondary">{p.calle} {p.numero}</Typography>
                                    )}
                                  </Box>
                                  {p.distance_km != null && (
                                    <Box sx={{
                                      background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.25)",
                                      borderRadius: 1.5, px: 1, py: 0.3, flexShrink: 0, textAlign: "center",
                                    }}>
                                      <Typography sx={{ fontSize: 9, color: "#8888aa", fontFamily: "'DM Mono', monospace", display: "block" }}>DIST</Typography>
                                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#00b4d8", fontFamily: "'DM Mono', monospace" }}>
                                        {p.distance_km.toFixed(1)}km
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>

                                <Box display="flex" gap={1} flexWrap="wrap">
                                  <Box sx={{ background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 1, px: 1, py: 0.3 }}>
                                    <Typography sx={{ fontSize: 11, color: "#8888aa", fontFamily: "'DM Mono', monospace" }}>{p.tipo_local}</Typography>
                                  </Box>
                                  <Box sx={{ background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 1, px: 1, py: 0.3 }}>
                                    <Typography sx={{ fontSize: 11, color: "#00f5a0", fontFamily: "'DM Mono', monospace" }}>{p.m2} m²</Typography>
                                  </Box>
                                  {p.modalidad && (
                                    <Box sx={{
                                      background: p.modalidad === "rent" ? "rgba(0,180,216,0.08)" : "rgba(0,245,160,0.06)",
                                      border: `1px solid ${p.modalidad === "rent" ? "rgba(0,180,216,0.3)" : "rgba(0,245,160,0.2)"}`,
                                      borderRadius: 1, px: 1, py: 0.3,
                                    }}>
                                      <Typography sx={{ fontSize: 11, color: p.modalidad === "rent" ? "#00b4d8" : "#00f5a0", fontFamily: "'DM Mono', monospace" }}>
                                        {p.modalidad === "rent" ? "Renta" : "Venta"}
                                      </Typography>
                                    </Box>
                                  )}
                                  {p.budget_status === "over" && (
                                    <Box sx={{ background: "#1a1200", border: "1px solid #3a2800", borderRadius: 1, px: 1, py: 0.3 }}>
                                      <Typography sx={{ fontSize: 11, color: "#ccaa44", fontFamily: "'DM Mono', monospace" }}>arriba de tu presupuesto</Typography>
                                    </Box>
                                  )}
                                </Box>

                                {/* Badge de saturación — el corazón de esta vista */}
                                <Box sx={{
                                  background: satCfg.bg,
                                  border: `1px solid ${satCfg.border}`,
                                  borderRadius: 1.5,
                                  px: 1.2, py: 0.7,
                                  display: "flex", gap: 1, alignItems: "center",
                                }}>
                                  <Typography fontSize={14}>{satCfg.icon}</Typography>
                                  <Typography sx={{ fontSize: 11, color: satCfg.color, fontFamily: "'DM Mono', monospace", lineHeight: 1.4 }}>
                                    {satCfg.text}
                                  </Typography>
                                </Box>

                                <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                                  <Typography fontWeight={800} fontSize={15} color={p.precio_inmueble ? "text.primary" : "text.secondary"}>
                                    {p.precio_inmueble ? `$${p.precio_inmueble.toLocaleString("en-US")} MXN` : "—"}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "#00f5a0", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                                    Ver detalles →
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </a>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* CTA: análisis IA completo */}
              <Box mt={3} p={2.5} borderRadius={2} bgcolor="#0c0c1e" border="1px solid #1a1a3a" textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  ¿Quieres recomendaciones de colonias, requisitos del espacio y consejos personalizados?
                </Typography>
                <Button variant="contained" onClick={handleAiAnalysis}>
                  Análisis IA completo →
                </Button>
              </Box>

              {error && (
                <Box mt={2} p={1.5} borderRadius={2} bgcolor="#2a0a0a" border="1px solid #5a1a1a">
                  <Typography variant="caption" color="error.main">⚠ {error}</Typography>
                </Box>
              )}
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

              {/* ── Locales que hacen match ─────────────────────────── */}
              {result.matching_properties?.length > 0 && (
                <Box mb={4}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                    <Typography variant="caption" sx={{ color: "#00f5a0", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
                      🏠 LOCALES DISPONIBLES QUE HACEN MATCH
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                      {result.matching_properties.length} encontrado{result.matching_properties.length !== 1 ? "s" : ""}
                    </Typography>
                  </Box>

                  <Box display="flex" flexDirection="column" gap={2}>
                    {result.matching_properties.map((p, i) => (
                      <a
                        key={p.id}
                        href={`/propiedades/${p.id}`}
                        style={{ textDecoration: "none", color: "inherit", display: "block" }}
                      >
                        <Box sx={{
                          border: i === 0 ? "1px solid #00f5a044" : "1px solid #1e1e3e",
                          borderRadius: 3,
                          overflow: "hidden",
                          transition: "transform 0.2s, border-color 0.2s",
                          "&:hover": { transform: "translateY(-2px)", borderColor: "rgba(0,245,160,0.3)" },
                          cursor: "pointer",
                        }}>
                          {/* Badge top pick */}
                          {i === 0 && (
                            <Box sx={{ background: "linear-gradient(135deg, #00f5a0, #00b4d8)", px: 2, py: 0.5 }}>
                              <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#0a0a14", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                                ✦ MEJOR MATCH
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ display: "flex", gap: 0 }}>
                            {/* Foto */}
                            <Box sx={{
                              width: 110, flexShrink: 0,
                              background: "#0e0e22",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 28, opacity: 0.4, minHeight: 110,
                              position: "relative", overflow: "hidden",
                            }}>
                              {p.photo_urls?.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.photo_urls[0]}
                                  alt={p.colonia}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, opacity: 1 }}
                                />
                              ) : "🏬"}
                            </Box>

                            {/* Info */}
                            <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                <Box>
                                  <Typography fontWeight={700} fontSize={14}>{p.colonia}</Typography>
                                  {p.calle && (
                                    <Typography variant="caption" color="text.secondary">{p.calle} {p.numero}</Typography>
                                  )}
                                </Box>
                                {/* Match score badge */}
                                <Box sx={{
                                  background: "rgba(0,245,160,0.08)", border: "1px solid rgba(0,245,160,0.2)",
                                  borderRadius: 1.5, px: 1, py: 0.3, flexShrink: 0, textAlign: "center",
                                }}>
                                  <Typography sx={{ fontSize: 9, color: "#8888aa", fontFamily: "'DM Mono', monospace", display: "block" }}>MATCH</Typography>
                                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#00f5a0", fontFamily: "'DM Mono', monospace" }}>
                                    {Math.min(p.match_score, 99)}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box display="flex" gap={1} flexWrap="wrap">
                                <Box sx={{ background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 1, px: 1, py: 0.3 }}>
                                  <Typography sx={{ fontSize: 11, color: "#8888aa", fontFamily: "'DM Mono', monospace" }}>{p.tipo_local}</Typography>
                                </Box>
                                <Box sx={{ background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 1, px: 1, py: 0.3 }}>
                                  <Typography sx={{ fontSize: 11, color: "#00f5a0", fontFamily: "'DM Mono', monospace" }}>{p.m2} m²</Typography>
                                </Box>
                                {p.modalidad && (
                                  <Box sx={{
                                    background: p.modalidad === "rent" ? "rgba(0,180,216,0.08)" : "rgba(0,245,160,0.06)",
                                    border: `1px solid ${p.modalidad === "rent" ? "rgba(0,180,216,0.3)" : "rgba(0,245,160,0.2)"}`,
                                    borderRadius: 1, px: 1, py: 0.3,
                                  }}>
                                    <Typography sx={{ fontSize: 11, color: p.modalidad === "rent" ? "#00b4d8" : "#00f5a0", fontFamily: "'DM Mono', monospace" }}>
                                      {p.modalidad === "rent" ? "For rent" : "For sale"}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {/* Match reasons */}
                              {p.match_reasons.length > 0 && (
                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                  {p.match_reasons.slice(0, 3).map((r, ri) => (
                                    <Typography key={ri} variant="caption" sx={{ color: "#555577", fontFamily: "'DM Mono', monospace", fontSize: 10 }}>
                                      · {r}
                                    </Typography>
                                  ))}
                                </Box>
                              )}

                              <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                                <Typography fontWeight={800} fontSize={15} color={p.precio_inmueble ? "text.primary" : "text.secondary"}>
                                  {p.precio_inmueble ? `$${p.precio_inmueble.toLocaleString("en-US")} MXN` : "—"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#00f5a0", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                                  Ver detalles →
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </a>
                    ))}
                  </Box>

                  <Box mt={2} textAlign="center">
                    <a href="/propiedades" style={{ textDecoration: "none" }}>
                      <Typography variant="caption" sx={{ color: "#00b4d8", fontFamily: "'DM Mono', monospace", fontSize: 12, "&:hover": { textDecoration: "underline" } }}>
                        Ver todos los locales disponibles →
                      </Typography>
                    </a>
                  </Box>
                </Box>
              )}

              {/* Si no hay locales en DB */}
              {result.matching_properties?.length === 0 && (
                <Box mb={4} p={2.5} borderRadius={2} bgcolor="#0a0a1e" border="1px solid #1e1e3e" textAlign="center">
                  <Typography fontSize={28} mb={1}>📭</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    No hay locales registrados que coincidan con tu búsqueda todavía.
                  </Typography>
                  <a href="/propiedades" style={{ textDecoration: "none" }}>
                    <Typography variant="caption" sx={{ color: "#00f5a0", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                      Ver todos los locales →
                    </Typography>
                  </a>
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
