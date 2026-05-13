"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  ThemeProvider, createTheme, Box, Typography, Button, TextField,
  Card, CardContent, Chip, CircularProgress, Slider, FormControl,
  Checkbox, FormControlLabel, FormGroup, ToggleButton, ToggleButtonGroup,
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

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface ColoniaResult {
  nombre: string;
  razon: string;
  nivel_competencia: "low" | "medium" | "high";
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
type Modalidad = "rent" | "sale" | "any";

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
    nivel: "low" | "medium" | "high";
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
  low:    { bg: "#001a10", border: "#003820", color: "#44cc88", label: "low competition" },
  medium: { bg: "#1a1200", border: "#3a2800", color: "#ccaa44", label: "medium competition" },
  high:   { bg: "#1a0808", border: "#3a1212", color: "#cc4444", label: "high competition" },
};

// ─── Ejemplos de descripción ─────────────────────────────────────────────────
const EJEMPLOS = [
  "I have an industrial espresso machine, refrigerated display cases and pastry equipment. Looking for a weekend space to fulfill my orders.",
  "I'm a hairstylist with my own scissors, chair and mirrors. I need a weekday space to see clients.",
  "I have sewing machines and fabric for custom clothing. Looking for a quiet space with good natural light.",
];

// ─── Componente principal ────────────────────────────────────────────────────
type AppState = "input" | "preflight_loading" | "preflight" | "ai_loading" | "result";

export default function BuscarLocal() {
  const [appState, setAppState] = useState<AppState>("input");
  const [descripcion, setDescripcion] = useState("");
  const [zona, setZona] = useState<{ label: string; lat: number; lng: number } | null>(null);
  const [modalidad, setModalidad] = useState<Modalidad>("any");
  const [presupuesto, setPresupuesto] = useState<number>(8000);
  const [disponibilidad, setDisponibilidad] = useState<string[]>([]);
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

  const toggleDisponibilidad = (val: string) => {
    setDisponibilidad((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  // ── Paso 1: preflight (DB + saturación) ────────────────────────────────────
  const handleSubmit = async () => {
    if (descripcion.trim().length < 10) {
      setError("Please describe your situation a bit more (minimum 10 characters).");
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
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setPreflight(data);
      setAppState("preflight");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error finding matches. Please try again.");
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
          disponibilidad,
          modalidad,
          // Anclamos el análisis al giro ya detectado para mejor calidad y consistencia
          giro_pre_detectado: preflight?.giro_detectado.label ?? null,
          preflight_property_ids: preflight?.properties_match.map((p) => p.id) ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data);
      setAppState("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error analyzing. Please try again.");
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
    setModalidad("any");
    setPresupuesto(8000);
    setDisponibilidad([]);
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
              <Chip label="search · beta" size="small" sx={{ bgcolor: "#1a1a3a", border: "1px solid #2a2a5a", color: "#8888cc", fontFamily: "'DM Mono', monospace", height: 20, fontSize: 10 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">find the ideal space for your project</Typography>
          </Box>

          {/* ── ESTADO: INPUT ───────────────────────────────────────────── */}
          {appState === "input" && (
            <Card elevation={0} sx={{ border: "1px solid #1e1e3e", borderRadius: 4, pt: 4, pb: 5, px: { xs: 3, md: 5 } }} className="fadein">

              <Typography variant="h6" fontWeight={700} mb={1}>What do you want to do?</Typography>
              <Typography variant="body2" color="text.secondary" mb={4} sx={{ lineHeight: 1.7 }}>
                Tell us your situation in your own words. AI will detect what type of business you want to start, what space you need, and the best areas for you.
              </Typography>

              {/* Textarea principal */}
              <Box mb={1}>
                <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#8888aa", letterSpacing: 1, fontSize: 13, display: "block", mb: 1 }}>
                  DESCRIBE YOUR SITUATION *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ex: I have an industrial espresso machine and pastry equipment. Looking for a weekend space to handle my orders..."
                  inputProps={{ maxLength: 600 }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    More details = better analysis
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
                  ADDITIONAL OPTIONS (optional)
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
                      RENT OR BUY?
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
                      <ToggleButton value="rent">Rent</ToggleButton>
                      <ToggleButton value="sale">Buy</ToggleButton>
                      <ToggleButton value="any">Any</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Presupuesto */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#8888aa", letterSpacing: 1, fontSize: 13 }}>
                        MONTHLY RENT BUDGET
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
                Analyze with AI →
              </Button>
            </Card>
          )}

          {/* ── ESTADO: PREFLIGHT LOADING ───────────────────────────────── */}
          {appState === "preflight_loading" && (
            <Box textAlign="center" py={12} className="fadein">
              <CircularProgress size={64} sx={{ color: "#00f5a0", mb: 3 }} />
              <Typography variant="h6" fontWeight={700}>Searching matches{dots}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                detecting category · checking inventory · measuring saturation
              </Typography>
            </Box>
          )}

          {/* ── ESTADO: AI LOADING ──────────────────────────────────────── */}
          {appState === "ai_loading" && (
            <Box textAlign="center" py={12} className="fadein">
              <CircularProgress size={64} sx={{ color: "#00f5a0", mb: 3 }} />
              <Typography variant="h6" fontWeight={700}>AI Analysis in progress{dots}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                interpreting your profile · analyzing zones · generating tips
              </Typography>
            </Box>
          )}

          {/* ── ESTADO: PREFLIGHT (matches + saturación) ────────────────── */}
          {appState === "preflight" && preflight && (
            <Box className="fadein">
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h5" fontWeight={800}>Quick results</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    inventory matches · no AI yet
                  </Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={backToInput}>← edit search</Button>
              </Box>

              {/* Giro detectado */}
              <Card elevation={0} sx={{ border: "1px solid #00f5a044", borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 2.5, pb: "20px !important" }}>
                  <Box display="flex" gap={1.5} alignItems="center">
                    <Typography fontSize={26}>{preflight.giro_detectado.emoji}</Typography>
                    <Box flex={1}>
                      <Typography variant="caption" sx={{ color: "#00f5a0", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
                        DETECTED CATEGORY {preflight.giro_detectado.source === "ai" && "· via AI"}
                        {preflight.giro_detectado.source === "keyword" && "· via keywords"}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>{preflight.giro_detectado.label}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={preflight.modalidad_filtro === "rent" ? "Rent" : preflight.modalidad_filtro === "sale" ? "Buy" : "Any"}
                      sx={{ bgcolor: "#12122a", border: "1px solid #2a2a4a", color: "#8888cc", fontFamily: "'DM Mono', monospace", fontSize: 11 }}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Resumen */}
              <Box mb={3} p={2} borderRadius={2} bgcolor="#0a0a1e" border="1px solid #1e1e3e">
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {preflight.geo_aplicado
                    ? <>Found <b style={{ color: "#00f5a0" }}>{preflight.properties_match.length}</b> space{preflight.properties_match.length !== 1 ? "s" : ""} within <b>{preflight.radio_km}km</b> of the selected area{preflight.modalidad_filtro !== "any" ? ` for ${preflight.modalidad_filtro === "rent" ? "rent" : "sale"}` : ""}.</>
                    : <>Showing <b style={{ color: "#00f5a0" }}>{preflight.properties_match.length}</b> available space{preflight.properties_match.length !== 1 ? "s" : ""}{preflight.modalidad_filtro !== "any" ? ` for ${preflight.modalidad_filtro === "rent" ? "rent" : "sale"}` : ""}. <i style={{ color: "#8888aa" }}>(no zone selected — no distance filter)</i></>
                  }
                </Typography>
              </Box>

              {/* Sin matches */}
              {preflight.properties_match.length === 0 && (
                <Box mb={4} p={3} borderRadius={2} bgcolor="#1a0808" border="1px solid #3a1212" textAlign="center">
                  <Typography fontSize={32} mb={1}>📭</Typography>
                  <Typography variant="body2" color="#ff8888" fontWeight={700} mb={1}>
                    No matching inventory.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
                    {preflight.geo_aplicado
                      ? "No spaces registered in that area with that filter. Try expanding the zone, switching rent↔buy, or request the AI analysis to discover better neighborhoods for your category."
                      : "No registered space matches that filter. Change the filter or request the AI analysis."}
                  </Typography>
                  <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                    <Button variant="outlined" size="small" onClick={backToInput}>Edit search</Button>
                    <Button variant="contained" size="small" onClick={handleAiAnalysis}>AI Analysis →</Button>
                  </Box>
                </Box>
              )}

              {/* Lista de matches con saturación */}
              {preflight.properties_match.length > 0 && (
                <Box mb={4}>
                  <Typography variant="caption" sx={{ color: "#8888aa", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 2 }}>
                    🏠 AVAILABLE SPACES (sorted by proximity)
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {preflight.properties_match.map((p) => {
                      const sat = p.saturacion;
                      const satCfg = sat.nivel === "high"
                        ? { bg: "#1a0808", border: "#3a1212", color: "#ff6b6b", icon: "⚠️", text: `High saturation: ${sat.competidores_500m} competitor${sat.competidores_500m !== 1 ? "s" : ""} within 500m, ${sat.competidores_2km} within 2km` }
                        : sat.nivel === "medium"
                          ? { bg: "#1a1200", border: "#3a2800", color: "#ccaa44", icon: "⚡", text: `Medium saturation: ${sat.competidores_500m} within 500m, ${sat.competidores_2km} within 2km` }
                          : { bg: "#001a10", border: "#003820", color: "#44cc88", icon: "✓", text: sat.competidores_2km > 0 ? `Low: only ${sat.competidores_2km} competitor${sat.competidores_2km !== 1 ? "s" : ""} within 2km` : "No direct competitors in the area" };

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
                                        {p.modalidad === "rent" ? "Rent" : "Sale"}
                                      </Typography>
                                    </Box>
                                  )}
                                  {p.budget_status === "over" && (
                                    <Box sx={{ background: "#1a1200", border: "1px solid #3a2800", borderRadius: 1, px: 1, py: 0.3 }}>
                                      <Typography sx={{ fontSize: 11, color: "#ccaa44", fontFamily: "'DM Mono', monospace" }}>above your budget</Typography>
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
                                    View details →
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

              {/* CTA: full AI analysis */}
              <Box mt={3} p={2.5} borderRadius={2} bgcolor="#0c0c1e" border="1px solid #1a1a3a" textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  Want neighborhood recommendations, space requirements and personalized tips?
                </Typography>
                <Button variant="contained" onClick={handleAiAnalysis}>
                  Full AI Analysis →
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
              {/* Result header */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4} flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h5" fontWeight={800}>Your space analysis</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    based on your description · indicative
                  </Typography>
                </Box>
                <Button variant="outlined" size="small" onClick={reset}>← new search</Button>
              </Box>

              {/* Giro detectado */}
              <Card elevation={0} sx={{ border: "1px solid #00f5a044", borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 3, pb: "24px !important" }}>
                  <Box display="flex" gap={1.5} alignItems="flex-start">
                    <Typography fontSize={28}>🤖</Typography>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#00f5a0", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
                        DETECTED CATEGORY
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
                    📐 SPACE REQUIREMENTS
                  </Typography>

                  <Box display="flex" gap={3} mb={3} flexWrap="wrap">
                    <Box sx={{ background: "#0c0c1e", border: "1px solid #1a1a3a", borderRadius: 2, px: 2.5, py: 1.5, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>minimum</Typography>
                      <Typography fontWeight={800} fontSize={22} color="#00b4d8">{result.requisitos_espacio.m2_minimo}</Typography>
                      <Typography variant="caption" color="text.secondary">m²</Typography>
                    </Box>
                    <Box sx={{ background: "#0c0c1e", border: "1px solid #1a1a3a", borderRadius: 2, px: 2.5, py: 1.5, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>ideal (recommended)</Typography>
                      <Typography fontWeight={800} fontSize={22} color="#00f5a0">{result.requisitos_espacio.m2_ideal}</Typography>
                      <Typography variant="caption" color="text.secondary">m²</Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>Required services</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {result.requisitos_espacio.servicios_necesarios.map((s, i) => (
                        <Chip key={i} label={s} size="small" sx={{ bgcolor: "#001a10", border: "1px solid #003820", color: "#44cc88", fontFamily: "'DM Mono', monospace", fontSize: 11 }} />
                      ))}
                    </Box>
                  </Box>

                  {result.requisitos_espacio.caracteristicas_deseables.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>Desirable</Typography>
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
                      BUDGET
                    </Typography>
                    <Typography variant="body2" color={result.presupuesto_viable ? "#44cc88" : "#ff8888"} mt={0.5}>
                      {result.mensaje_presupuesto}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Colonias recomendadas */}
              <Typography variant="caption" sx={{ color: "#8888aa", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 2 }}>
                📍 RECOMMENDED NEIGHBORHOODS
              </Typography>
              <Box display="flex" flexDirection="column" gap={2} mb={3}>
                {result.colonias_recomendadas.map((col, i) => (
                  <Card key={i} elevation={0} sx={{ border: i === 0 ? "1px solid #00f5a044" : "1px solid #1e1e3e", borderRadius: 3, position: "relative", transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>
                    {i === 0 && (
                      <Chip label="BEST OPTION" size="small" sx={{ position: "absolute", top: -10, right: 16, background: "linear-gradient(135deg, #00f5a0, #00b4d8)", color: "#0a0a14", fontWeight: 800, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1 }} />
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
                        <Typography variant="caption" color="text.secondary" sx={{ width: 90, flexShrink: 0 }}>opportunity</Typography>
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
                    ⚠️ ALERTS
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
                    💡 PRACTICAL TIPS
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
                      🏠 AVAILABLE SPACES MATCHING YOUR SEARCH
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                      {result.matching_properties.length} found
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
                                ✦ BEST MATCH
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
                                  View details →
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
                        View all available spaces →
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
                    No registered spaces match your search yet.
                  </Typography>
                  <a href="/propiedades" style={{ textDecoration: "none" }}>
                    <Typography variant="caption" sx={{ color: "#00f5a0", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                      View all spaces →
                    </Typography>
                  </a>
                </Box>
              )}

              <Typography variant="caption" display="block" textAlign="center" color="#333355">
                AI-generated analysis · indicative data · validate with field research
              </Typography>
            </Box>
          )}

        </Box>
      </Box>
    </ThemeProvider>
  );
}
