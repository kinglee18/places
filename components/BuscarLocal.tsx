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
    <Box sx={{ height: 320, borderRadius: "12px", bgcolor: "#edf0f8", border: "1px solid #d5daea", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography variant="caption" color="text.secondary">Loading map...</Typography>
    </Box>
  ),
});

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f1b3d" },
    secondary: { main: "#3b6fa0" },
    background: { default: "#f7f8fd", paper: "#ffffff" },
    text: { primary: "#181e38", secondary: "#5a6288" },
    error: { main: "#e53935" },
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
          backgroundColor: "#edf0f8",
          "& fieldset": { borderColor: "#d5daea" },
          "&:hover fieldset": { borderColor: "#a4b4d2" },
          "&.Mui-focused fieldset": { borderColor: "#3b6fa0" },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontFamily: "'DM Mono', monospace", color: "#5a6288", fontSize: "14px" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: "12px 24px" },
        containedPrimary: {
          background: "linear-gradient(135deg, #0f1b3d, #3b6fa0)",
          color: "#f7f8fd",
          "&:hover": { opacity: 0.9, transform: "scale(1.02)" },
          transition: "all 0.2s",
        },
        outlined: {
          borderColor: "#d5daea",
          color: "#181e38",
          "&:hover": { backgroundColor: "#edf0f8", borderColor: "#a4b4d2" },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: "#3b6fa0" },
        rail: { backgroundColor: "#d5daea" },
        mark: { backgroundColor: "#d5daea" },
        markLabel: { fontFamily: "'DM Mono', monospace", color: "#5a6288", fontSize: 11 },
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
    <Box sx={{ background: "#e4e7f4", borderRadius: 1, height: 6, overflow: "hidden", flex: 1 }}>
      <Box sx={{ width: `${width}%`, height: "100%", background: color, borderRadius: 1, transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)" }} />
    </Box>
  );
}

// ─── Badge de competencia ────────────────────────────────────────────────────
const compConfig = {
  low:    { bg: "oklch(0.95 0.06 155)", border: "oklch(0.82 0.1 155)", color: "oklch(0.42 0.14 155)", label: "low competition" },
  medium: { bg: "oklch(0.97 0.05 70)",  border: "oklch(0.85 0.1 70)",  color: "oklch(0.52 0.14 70)",  label: "medium competition" },
  high:   { bg: "oklch(0.96 0.06 25)",  border: "oklch(0.83 0.12 25)", color: "oklch(0.50 0.18 25)",  label: "high competition" },
};

// ─── Quick category chips ─────────────────────────────────────────────────────
const QUICK_CHIPS = [
  'Chinese food', 'Coffee shop', 'Yoga studio',
  'Bookstore', 'Bakery', 'Gym',
];

// ─── Componente principal ────────────────────────────────────────────────────
type AppState = "input" | "preflight_loading" | "preflight" | "ai_loading" | "result";

export default function BuscarLocal() {
  const [appState, setAppState] = useState<AppState>("input");
  const [descripcion, setDescripcion] = useState("");
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [zona, setZona] = useState<{ label: string; lat: number; lng: number } | null>(null);
  const [modalidad, setModalidad] = useState<Modalidad>("any");
  const [presupuesto, setPresupuesto] = useState<number>(8000);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [result, setResult] = useState<BuscarResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState("");

  const isLoading = appState === "preflight_loading" || appState === "ai_loading";

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => { clearInterval(interval); setDots(""); };
  }, [isLoading]);

  // ── Paso 1: preflight (DB + saturación) ────────────────────────────────────
  const handleSubmitWith = async (bt: string, loc: string) => {
    const parts = [bt.trim(), loc.trim() ? `in ${loc.trim()}` : ""].filter(Boolean);
    const combined = parts.join(" ") || descripcion.trim();
    if (combined.length < 3) {
      setError("Please enter a business type or location.");
      return;
    }
    setDescripcion(combined);
    setError(null);
    setAppState("preflight_loading");

    try {
      const res = await fetch("/api/buscar/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: combined,
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

  const handleSubmit = () => handleSubmitWith(businessType, location);

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
    setLocation("");
    setBusinessType("");
    setShowAdvanced(false);
    setZona(null);
    setModalidad("any");
    setPresupuesto(8000);
  };

  const backToInput = () => {
    setAppState("input");
    setError(null);
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400&display=swap');
        .grid-bg { background-image: radial-gradient(circle, #c8d0e8 1px, transparent 1px); background-size: 24px 24px; }
        @keyframes fadein { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .fadein { animation: fadein 0.4s ease both; }
      `}</style>

      <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", bgcolor: "background.default", color: "text.primary", pb: 12 }}>
        {/* Background */}
        <Box className="grid-bg" sx={{ position: "fixed", inset: 0, opacity: 0.5, pointerEvents: "none", zIndex: 0 }} />
        <Box sx={{ position: "fixed", top: -200, left: -200, width: 600, height: 600, background: "radial-gradient(circle, rgba(59,111,160,0.05) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />
        <Box sx={{ position: "fixed", bottom: -200, right: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(0,180,216,0.04) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

        <Box sx={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <Box mb={6}>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <Box sx={{ width: 32, height: 32, background: "linear-gradient(135deg, #0f1b3d, #3b6fa0)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔍</Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: "#181e38" }}>
                Local<span style={{ color: "oklch(0.45 0.08 250)" }}>IQ</span>
              </Typography>
              <Chip label="search · beta" size="small" sx={{ bgcolor: "#edf0f8", border: "1px solid #d5daea", color: "#5a6288", fontFamily: "'DM Mono', monospace", height: 20, fontSize: 10 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">find the ideal space for your project</Typography>
          </Box>

          {/* ── ESTADO: INPUT ───────────────────────────────────────────── */}
          {appState === "input" && (
            <Box className="fadein">
              {/* Hero heading */}
              <Box textAlign="center" mb={5}>
                <Typography variant="h4" fontWeight={800} sx={{ color: "#181e38", lineHeight: 1.2, mb: 2 }}>
                  Find the perfect{" "}
                  <span style={{ color: "oklch(0.45 0.12 155)" }}>commercial space</span>
                  {" "}for your next business.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, mx: "auto", lineHeight: 1.8 }}>
                  We analyze nearby competition, foot traffic and demand to recommend exactly which business will thrive in each available space.
                </Typography>
              </Box>

              {/* Search bar */}
              <Box sx={{
                bgcolor: "#ffffff",
                border: "1px solid #d5daea",
                borderRadius: 40,
                display: "flex",
                alignItems: "center",
                px: 1,
                mb: 2,
                gap: 0,
                boxShadow: "0 2px 12px rgba(15,27,61,0.07)",
                transition: "border-color 0.2s, box-shadow 0.2s",
                "&:focus-within": { borderColor: "#a4b4d2", boxShadow: "0 2px 16px rgba(59,111,160,0.12)" },
              }}>
                {/* Location input */}
                <Box sx={{ display: "flex", alignItems: "center", flex: 1, px: 2, py: 0.5 }}>
                  <Typography sx={{ color: "#9099b8", fontSize: 16, mr: 1, flexShrink: 0 }}>📍</Typography>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    placeholder="Neighborhood or city (e.g. Condesa, CDMX)"
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#181e38",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 14,
                      width: "100%",
                    }}
                  />
                </Box>

                {/* Divider */}
                <Box sx={{ width: "1px", height: 36, bgcolor: "#d5daea", flexShrink: 0 }} />

                {/* Business type input */}
                <Box sx={{ display: "flex", alignItems: "center", flex: 1, px: 2, py: 0.5 }}>
                  <Typography sx={{ color: "#9099b8", fontSize: 14, mr: 1, flexShrink: 0 }}>↗</Typography>
                  <input
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    placeholder="Optional: what do you want to open?"
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#181e38",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 14,
                      width: "100%",
                    }}
                  />
                </Box>

                {/* CTA button */}
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  sx={{ borderRadius: 40, px: 3, py: 1.5, flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  Find spaces →
                </Button>
              </Box>

              {/* Quick chips */}
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={4} justifyContent="center">
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  Try:
                </Typography>
                {QUICK_CHIPS.map((chip) => (
                  <Chip
                    key={chip}
                    label={chip}
                    size="small"
                    onClick={() => {
                      setBusinessType(chip);
                      handleSubmitWith(chip, location);
                    }}
                    sx={{
                      bgcolor: "#f0f2fa",
                      border: "1px solid #d5daea",
                      color: "#5a6288",
                      cursor: "pointer",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      "&:hover": { borderColor: "#3b6fa0", color: "#0f1b3d", bgcolor: "#edf0f8" },
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </Box>

              {/* Advanced options (collapsible) */}
              <Box textAlign="center" mb={2}>
                <Typography
                  variant="caption"
                  onClick={() => setShowAdvanced((v) => !v)}
                  sx={{
                    color: "#9099b8",
                    cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    "&:hover": { color: "#5a6288" },
                    transition: "color 0.2s",
                  }}
                >
                  {showAdvanced ? "▲ Hide filters" : "⚙ Advanced filters"}
                </Typography>
              </Box>

              {showAdvanced && (
                <Box sx={{ background: "#f5f6fc", border: "1px solid #e4e7f4", borderRadius: 3, p: 3, mb: 4 }} className="fadein">
                  <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#9099b8", letterSpacing: 1, fontSize: 11, display: "block", mb: 3 }}>
                    ADDITIONAL OPTIONS
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={3.5}>
                    {/* Zona */}
                    <FormControl fullWidth>
                      <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#5a6288", letterSpacing: 1, fontSize: 13, display: "block", mb: 1.5 }}>
                        PREFERRED ZONE (map)
                      </Typography>
                      <ZonaPicker onChange={setZona} />
                    </FormControl>

                    {/* Modalidad */}
                    <Box>
                      <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#5a6288", letterSpacing: 1, fontSize: 13, display: "block", mb: 1.5 }}>
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
                            color: "#5a6288",
                            borderColor: "#d5daea",
                            textTransform: "none",
                            px: 2,
                            py: 0.7,
                            "&.Mui-selected": {
                              background: "rgba(15,27,61,0.06)",
                              color: "#0f1b3d",
                              borderColor: "rgba(15,27,61,0.3)",
                              "&:hover": { background: "rgba(15,27,61,0.1)" },
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
                        <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#5a6288", letterSpacing: 1, fontSize: 13 }}>
                          MONTHLY RENT BUDGET
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "#3b6fa0", fontWeight: 700 }}>
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
              )}

              {/* Error */}
              {error && (
                <Box mb={3} p={1.5} borderRadius={2} bgcolor="#fef2f2" border="1px solid #fca5a5">
                  <Typography variant="caption" color="error.main">⚠ {error}</Typography>
                </Box>
              )}
            </Box>
          )}

          {/* ── ESTADO: PREFLIGHT LOADING ───────────────────────────────── */}
          {appState === "preflight_loading" && (
            <Box textAlign="center" py={12} className="fadein">
              <CircularProgress size={64} sx={{ color: "#3b6fa0", mb: 3 }} />
              <Typography variant="h6" fontWeight={700}>Searching matches{dots}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                detecting category · checking inventory · measuring saturation
              </Typography>
            </Box>
          )}

          {/* ── ESTADO: AI LOADING ──────────────────────────────────────── */}
          {appState === "ai_loading" && (
            <Box textAlign="center" py={12} className="fadein">
              <CircularProgress size={64} sx={{ color: "#3b6fa0", mb: 3 }} />
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
              <Card elevation={0} sx={{ border: "1px solid rgba(59,111,160,0.3)", borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 2.5, pb: "20px !important" }}>
                  <Box display="flex" gap={1.5} alignItems="center">
                    <Typography fontSize={26}>{preflight.giro_detectado.emoji}</Typography>
                    <Box flex={1}>
                      <Typography variant="caption" sx={{ color: "#3b6fa0", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
                        DETECTED CATEGORY {preflight.giro_detectado.source === "ai" && "· via AI"}
                        {preflight.giro_detectado.source === "keyword" && "· via keywords"}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>{preflight.giro_detectado.label}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={preflight.modalidad_filtro === "rent" ? "Rent" : preflight.modalidad_filtro === "sale" ? "Buy" : "Any"}
                      sx={{ bgcolor: "#edf0f8", border: "1px solid #d5daea", color: "#5a6288", fontFamily: "'DM Mono', monospace", fontSize: 11 }}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Resumen */}
              <Box mb={3} p={2} borderRadius={2} bgcolor="#f0f2fa" border="1px solid #d5daea">
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {preflight.geo_aplicado
                    ? <>Found <b style={{ color: "#3b6fa0" }}>{preflight.properties_match.length}</b> space{preflight.properties_match.length !== 1 ? "s" : ""} within <b>{preflight.radio_km}km</b> of the selected area{preflight.modalidad_filtro !== "any" ? ` for ${preflight.modalidad_filtro === "rent" ? "rent" : "sale"}` : ""}.</>
                    : <>Showing <b style={{ color: "#3b6fa0" }}>{preflight.properties_match.length}</b> available space{preflight.properties_match.length !== 1 ? "s" : ""}{preflight.modalidad_filtro !== "any" ? ` for ${preflight.modalidad_filtro === "rent" ? "rent" : "sale"}` : ""}. <i style={{ color: "#9099b8" }}>(no zone selected — no distance filter)</i></>
                  }
                </Typography>
              </Box>

              {/* Sin matches */}
              {preflight.properties_match.length === 0 && (
                <Box mb={4} p={3} borderRadius={2} bgcolor="#fff1f2" border="1px solid #fca5a5" textAlign="center">
                  <Typography fontSize={32} mb={1}>📭</Typography>
                  <Typography variant="body2" color="#dc2626" fontWeight={700} mb={1}>
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
                  <Typography variant="caption" sx={{ color: "#5a6288", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 2 }}>
                    🏠 AVAILABLE SPACES (sorted by proximity)
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {preflight.properties_match.map((p) => {
                      const sat = p.saturacion;
                      const satCfg = sat.nivel === "high"
                        ? { bg: "oklch(0.97 0.04 25)",  border: "oklch(0.88 0.1 25)",  color: "oklch(0.50 0.18 25)",  icon: "⚠️", text: `High saturation: ${sat.competidores_500m} competitor${sat.competidores_500m !== 1 ? "s" : ""} within 500m, ${sat.competidores_2km} within 2km` }
                        : sat.nivel === "medium"
                          ? { bg: "oklch(0.98 0.03 70)",  border: "oklch(0.88 0.08 70)",  color: "oklch(0.52 0.14 70)",  icon: "⚡", text: `Medium saturation: ${sat.competidores_500m} within 500m, ${sat.competidores_2km} within 2km` }
                          : { bg: "oklch(0.97 0.05 155)", border: "oklch(0.88 0.1 155)",  color: "oklch(0.42 0.14 155)", icon: "✓", text: sat.competidores_2km > 0 ? `Low: only ${sat.competidores_2km} competitor${sat.competidores_2km !== 1 ? "s" : ""} within 2km` : "No direct competitors in the area" };

                      return (
                        <a
                          key={p.id}
                          href={`/propiedades/${p.id}`}
                          style={{ textDecoration: "none", color: "inherit", display: "block" }}
                        >
                          <Box sx={{
                            border: "1px solid #d5daea",
                            borderRadius: 3,
                            overflow: "hidden",
                            bgcolor: "#ffffff",
                            transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                            "&:hover": { transform: "translateY(-2px)", borderColor: "#a4b4d2", boxShadow: "0 4px 16px rgba(15,27,61,0.08)" },
                            cursor: "pointer",
                          }}>
                            <Box sx={{ display: "flex", gap: 0 }}>
                              {/* Foto */}
                              <Box sx={{
                                width: 110, flexShrink: 0,
                                background: "#edf0f8",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 28, opacity: 0.6, minHeight: 130,
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
                                      background: "#edf0f8", border: "1px solid #d5daea",
                                      borderRadius: 1.5, px: 1, py: 0.3, flexShrink: 0, textAlign: "center",
                                    }}>
                                      <Typography sx={{ fontSize: 9, color: "#9099b8", fontFamily: "'DM Mono', monospace", display: "block" }}>DIST</Typography>
                                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#3b6fa0", fontFamily: "'DM Mono', monospace" }}>
                                        {p.distance_km.toFixed(1)}km
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>

                                <Box display="flex" gap={1} flexWrap="wrap">
                                  <Box sx={{ background: "#f0f2fa", border: "1px solid #d5daea", borderRadius: 1, px: 1, py: 0.3 }}>
                                    <Typography sx={{ fontSize: 11, color: "#5a6288", fontFamily: "'DM Mono', monospace" }}>{p.tipo_local}</Typography>
                                  </Box>
                                  <Box sx={{ background: "#f0f2fa", border: "1px solid #d5daea", borderRadius: 1, px: 1, py: 0.3 }}>
                                    <Typography sx={{ fontSize: 11, color: "#3b6fa0", fontFamily: "'DM Mono', monospace" }}>{p.m2} m²</Typography>
                                  </Box>
                                  {p.modalidad && (
                                    <Box sx={{
                                      background: p.modalidad === "rent" ? "rgba(59,111,160,0.08)" : "rgba(15,27,61,0.05)",
                                      border: `1px solid ${p.modalidad === "rent" ? "rgba(59,111,160,0.3)" : "rgba(15,27,61,0.2)"}`,
                                      borderRadius: 1, px: 1, py: 0.3,
                                    }}>
                                      <Typography sx={{ fontSize: 11, color: p.modalidad === "rent" ? "#3b6fa0" : "#0f1b3d", fontFamily: "'DM Mono', monospace" }}>
                                        {p.modalidad === "rent" ? "Rent" : "Sale"}
                                      </Typography>
                                    </Box>
                                  )}
                                  {p.budget_status === "over" && (
                                    <Box sx={{ background: "oklch(0.98 0.03 70)", border: "1px solid oklch(0.88 0.08 70)", borderRadius: 1, px: 1, py: 0.3 }}>
                                      <Typography sx={{ fontSize: 11, color: "oklch(0.52 0.14 70)", fontFamily: "'DM Mono', monospace" }}>above your budget</Typography>
                                    </Box>
                                  )}
                                </Box>

                                {/* Saturation badge */}
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
                                  <Typography variant="caption" sx={{ color: "#3b6fa0", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
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
              <Box mt={3} p={2.5} borderRadius={2} bgcolor="#f5f6fc" border="1px solid #e4e7f4" textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  Want neighborhood recommendations, space requirements and personalized tips?
                </Typography>
                <Button variant="contained" onClick={handleAiAnalysis}>
                  Full AI Analysis →
                </Button>
              </Box>

              {error && (
                <Box mt={2} p={1.5} borderRadius={2} bgcolor="#fef2f2" border="1px solid #fca5a5">
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
              <Card elevation={0} sx={{ border: "1px solid rgba(59,111,160,0.3)", borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 3, pb: "24px !important" }}>
                  <Box display="flex" gap={1.5} alignItems="flex-start">
                    <Typography fontSize={28}>🤖</Typography>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#3b6fa0", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
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
              <Card elevation={0} sx={{ border: "1px solid #d5daea", borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 3, pb: "24px !important" }}>
                  <Typography variant="caption" sx={{ color: "#3b6fa0", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 2 }}>
                    📐 SPACE REQUIREMENTS
                  </Typography>

                  <Box display="flex" gap={3} mb={3} flexWrap="wrap">
                    <Box sx={{ background: "#edf0f8", border: "1px solid #d5daea", borderRadius: 2, px: 2.5, py: 1.5, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>minimum</Typography>
                      <Typography fontWeight={800} fontSize={22} color="#3b6fa0">{result.requisitos_espacio.m2_minimo}</Typography>
                      <Typography variant="caption" color="text.secondary">m²</Typography>
                    </Box>
                    <Box sx={{ background: "#edf0f8", border: "1px solid #d5daea", borderRadius: 2, px: 2.5, py: 1.5, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>ideal (recommended)</Typography>
                      <Typography fontWeight={800} fontSize={22} color="#0f1b3d">{result.requisitos_espacio.m2_ideal}</Typography>
                      <Typography variant="caption" color="text.secondary">m²</Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>Required services</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {result.requisitos_espacio.servicios_necesarios.map((s, i) => (
                        <Chip key={i} label={s} size="small" sx={{ bgcolor: "oklch(0.97 0.05 155)", border: "1px solid oklch(0.88 0.1 155)", color: "oklch(0.42 0.14 155)", fontFamily: "'DM Mono', monospace", fontSize: 11 }} />
                      ))}
                    </Box>
                  </Box>

                  {result.requisitos_espacio.caracteristicas_deseables.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>Desirable</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {result.requisitos_espacio.caracteristicas_deseables.map((c, i) => (
                          <Chip key={i} label={c} size="small" sx={{ bgcolor: "#f0f2fa", border: "1px solid #d5daea", color: "#5a6288", fontFamily: "'DM Mono', monospace", fontSize: 11 }} />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Presupuesto */}
              {result.mensaje_presupuesto && (
                <Box mb={3} p={2} borderRadius={2}
                  bgcolor={result.presupuesto_viable ? "oklch(0.97 0.05 155)" : "#fff1f2"}
                  border={`1px solid ${result.presupuesto_viable ? "oklch(0.88 0.1 155)" : "#fca5a5"}`}
                  display="flex" gap={1.5} alignItems="flex-start"
                >
                  <Typography fontSize={20}>{result.presupuesto_viable ? "✅" : "⚠️"}</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ color: result.presupuesto_viable ? "oklch(0.42 0.14 155)" : "#dc2626", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
                      BUDGET
                    </Typography>
                    <Typography variant="body2" color={result.presupuesto_viable ? "oklch(0.42 0.14 155)" : "#dc2626"} mt={0.5}>
                      {result.mensaje_presupuesto}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Colonias recomendadas */}
              <Typography variant="caption" sx={{ color: "#5a6288", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 2 }}>
                📍 RECOMMENDED NEIGHBORHOODS
              </Typography>
              <Box display="flex" flexDirection="column" gap={2} mb={3}>
                {result.colonias_recomendadas.map((col, i) => (
                  <Card key={i} elevation={0} sx={{ border: i === 0 ? "1px solid rgba(59,111,160,0.4)" : "1px solid #d5daea", bgcolor: "#ffffff", borderRadius: 3, position: "relative", transition: "transform 0.2s, box-shadow 0.2s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(15,27,61,0.08)" } }}>
                    {i === 0 && (
                      <Chip label="BEST OPTION" size="small" sx={{ position: "absolute", top: -10, right: 16, background: "linear-gradient(135deg, #0f1b3d, #3b6fa0)", color: "#f7f8fd", fontWeight: 800, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1 }} />
                    )}
                    <CardContent sx={{ p: 3, pb: "24px !important" }}>
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} mb={2}>
                        <Typography variant="h6" fontSize={17} fontWeight={700}>{col.nombre}</Typography>
                        <Box sx={{ ...compConfig[col.nivel_competencia], px: 1.5, py: 0.5, borderRadius: 1.5, textAlign: "center", flexShrink: 0 }}>
                          <Typography fontSize={10} sx={{ opacity: 0.8, fontFamily: "'DM Mono', monospace" }}>{compConfig[col.nivel_competencia].label}</Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2} sx={{ lineHeight: 1.6 }}>
                        {col.razon}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="caption" color="text.secondary" sx={{ width: 90, flexShrink: 0 }}>opportunity</Typography>
                        <ScoreBar score={col.nivel_oportunidad} color="#3b6fa0" />
                        <Typography variant="caption" sx={{ color: "#3b6fa0", width: 28, textAlign: "right", fontWeight: 700 }}>
                          {col.nivel_oportunidad}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Alertas */}
              {result.alertas.length > 0 && (
                <Box mb={3} p={2.5} borderRadius={2} bgcolor="#fffbeb" border="1px solid #fde68a">
                  <Typography variant="caption" sx={{ color: "oklch(0.48 0.14 70)", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 1.5 }}>
                    ⚠️ ALERTS
                  </Typography>
                  {result.alertas.map((a, i) => (
                    <Typography key={i} variant="body2" color="oklch(0.52 0.14 70)" sx={{ lineHeight: 1.7 }}>· {a}</Typography>
                  ))}
                </Box>
              )}

              {/* Consejos */}
              {result.consejos.length > 0 && (
                <Box mb={4} p={2.5} borderRadius={2} bgcolor="#f5f6fc" border="1px solid #e4e7f4">
                  <Typography variant="caption" sx={{ color: "#3b6fa0", fontWeight: 700, letterSpacing: 1, fontSize: 11, display: "block", mb: 1.5 }}>
                    💡 PRACTICAL TIPS
                  </Typography>
                  {result.consejos.map((c, i) => (
                    <Typography key={i} variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>· {c}</Typography>
                  ))}
                </Box>
              )}

              {/* Locales que hacen match */}
              {result.matching_properties?.length > 0 && (
                <Box mb={4}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                    <Typography variant="caption" sx={{ color: "#3b6fa0", fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
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
                          border: i === 0 ? "1px solid rgba(59,111,160,0.4)" : "1px solid #d5daea",
                          borderRadius: 3,
                          overflow: "hidden",
                          bgcolor: "#ffffff",
                          transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                          "&:hover": { transform: "translateY(-2px)", borderColor: "#a4b4d2", boxShadow: "0 4px 16px rgba(15,27,61,0.08)" },
                          cursor: "pointer",
                        }}>
                          {/* Badge top pick */}
                          {i === 0 && (
                            <Box sx={{ background: "linear-gradient(135deg, #0f1b3d, #3b6fa0)", px: 2, py: 0.5 }}>
                              <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#f7f8fd", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                                ✦ BEST MATCH
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ display: "flex", gap: 0 }}>
                            {/* Foto */}
                            <Box sx={{
                              width: 110, flexShrink: 0,
                              background: "#edf0f8",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 28, opacity: 0.6, minHeight: 110,
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
                                  background: "#edf0f8", border: "1px solid #d5daea",
                                  borderRadius: 1.5, px: 1, py: 0.3, flexShrink: 0, textAlign: "center",
                                }}>
                                  <Typography sx={{ fontSize: 9, color: "#9099b8", fontFamily: "'DM Mono', monospace", display: "block" }}>MATCH</Typography>
                                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#0f1b3d", fontFamily: "'DM Mono', monospace" }}>
                                    {Math.min(p.match_score, 99)}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box display="flex" gap={1} flexWrap="wrap">
                                <Box sx={{ background: "#f0f2fa", border: "1px solid #d5daea", borderRadius: 1, px: 1, py: 0.3 }}>
                                  <Typography sx={{ fontSize: 11, color: "#5a6288", fontFamily: "'DM Mono', monospace" }}>{p.tipo_local}</Typography>
                                </Box>
                                <Box sx={{ background: "#f0f2fa", border: "1px solid #d5daea", borderRadius: 1, px: 1, py: 0.3 }}>
                                  <Typography sx={{ fontSize: 11, color: "#3b6fa0", fontFamily: "'DM Mono', monospace" }}>{p.m2} m²</Typography>
                                </Box>
                                {p.modalidad && (
                                  <Box sx={{
                                    background: p.modalidad === "rent" ? "rgba(59,111,160,0.08)" : "rgba(15,27,61,0.05)",
                                    border: `1px solid ${p.modalidad === "rent" ? "rgba(59,111,160,0.3)" : "rgba(15,27,61,0.2)"}`,
                                    borderRadius: 1, px: 1, py: 0.3,
                                  }}>
                                    <Typography sx={{ fontSize: 11, color: p.modalidad === "rent" ? "#3b6fa0" : "#0f1b3d", fontFamily: "'DM Mono', monospace" }}>
                                      {p.modalidad === "rent" ? "For rent" : "For sale"}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {/* Match reasons */}
                              {p.match_reasons.length > 0 && (
                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                  {p.match_reasons.slice(0, 3).map((r, ri) => (
                                    <Typography key={ri} variant="caption" sx={{ color: "#9099b8", fontFamily: "'DM Mono', monospace", fontSize: 10 }}>
                                      · {r}
                                    </Typography>
                                  ))}
                                </Box>
                              )}

                              <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                                <Typography fontWeight={800} fontSize={15} color={p.precio_inmueble ? "text.primary" : "text.secondary"}>
                                  {p.precio_inmueble ? `$${p.precio_inmueble.toLocaleString("en-US")} MXN` : "—"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#3b6fa0", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
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
                      <Typography variant="caption" sx={{ color: "#3b6fa0", fontFamily: "'DM Mono', monospace", fontSize: 12, "&:hover": { textDecoration: "underline" } }}>
                        View all available spaces →
                      </Typography>
                    </a>
                  </Box>
                </Box>
              )}

              {/* No properties in DB */}
              {result.matching_properties?.length === 0 && (
                <Box mb={4} p={2.5} borderRadius={2} bgcolor="#f5f6fc" border="1px solid #e4e7f4" textAlign="center">
                  <Typography fontSize={28} mb={1}>📭</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    No registered spaces match your search yet.
                  </Typography>
                  <a href="/propiedades" style={{ textDecoration: "none" }}>
                    <Typography variant="caption" sx={{ color: "#3b6fa0", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                      View all spaces →
                    </Typography>
                  </a>
                </Box>
              )}

              <Typography variant="caption" display="block" textAlign="center" color="#9099b8">
                AI-generated analysis · indicative data · validate with field research
              </Typography>
            </Box>
          )}

        </Box>
      </Box>
    </ThemeProvider>
  );
}
