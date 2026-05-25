"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { getSupabase } from "@/lib/supabase";
import {
  ThemeProvider, createTheme, Box, Typography, Button, Stepper, Step, StepLabel,
  TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Grid, Card,
  CircularProgress, IconButton,
} from "@mui/material";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 280, borderRadius: "12px", bgcolor: "var(--surface-2)", border: "1px solid var(--surface-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography variant="caption" color="text.secondary">Cargando mapa...</Typography>
    </Box>
  ),
});

const darkTheme = createTheme({
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
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: "#d5daea",
          border: "2px solid #cad2e4",
          borderRadius: "50%",
          "&.Mui-active": { color: "#f7f8fd", border: "2px solid #3b6fa0", backgroundColor: "#0f1b3d" },
          "&.Mui-completed": { color: "#3b6fa0", border: "none" },
        },
        text: { fill: "#5a6288", fontFamily: "'Syne', sans-serif", fontWeight: 800 },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontFamily: "'DM Mono', monospace", color: "#787ea0", "&.Mui-active": { color: "#181e38", fontWeight: 700 } },
      },
    },
  },
});

const TIPOS_LOCAL = [
  "Street-facing (with storefront)",
  "Inside commercial plaza",
  "Corner unit",
  "Basement / Semi-basement",
  "Market stall",
];

const NIVELES_PISO = [
  "Ground floor (street level)",
  "Mezzanine",
  "2nd floor",
  "3rd floor or above",
  "Basement / semi-basement",
];

const USOS_ANTERIORES = [
  "Restaurant / food service",
  "Retail / store",
  "Office",
  "Gym / wellness",
  "Beauty / salon",
  "Medical / clinic",
  "Warehouse",
  "Vacant (never used)",
  "Other",
];

function NumberStepper({ label, value, onChange, min = 0, max = 99 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const btnStyle: React.CSSProperties = {
    width: 34, height: 34, border: "1px solid var(--surface-border)",
    borderRadius: 8, background: "var(--surface-2)", color: "var(--brand)",
    fontSize: 20, lineHeight: 1, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "all 0.15s", fontFamily: "'Syne', sans-serif",
    userSelect: "none" as const,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--muted)", fontSize: 13, letterSpacing: 1 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", border: "1px solid var(--surface-border)", borderRadius: 8, padding: "6px 12px", height: 50 }}>
        <button type="button" style={btnStyle} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <span style={{ flex: 1, textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>{value}</span>
        <button type="button" style={btnStyle} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}

export interface PropertyData {
  id: string;
  colonia: string;
  calle: string | null;
  numero: string | null;
  lat: number | null;
  lng: number | null;
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
  descripcion: string | null;
  photo_urls: string[];
}

interface EditFormData {
  colonia: string;
  calle: string;
  numero: string;
  tipo_local: string;
  m2: number | "";
  antiguedad: number | "";
  nivel_piso: string;
  uso_anterior: string;
  agua_drenaje: string;
  habitaciones: number;
  banos: number;
  estacionamientos: number;
  modalidad: string;
  precio_inmueble: string;
  precio_mantenimiento: string;
  descripcion: string;
}

const steps = ["Location", "Features", "Details"];

export default function EditProperty({ property }: { property: PropertyData }) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(
    property.lat && property.lng ? { lat: property.lat, lng: property.lng } : null
  );
  const [keptPhotoUrls, setKeptPhotoUrls] = useState<string[]>(property.photo_urls ?? []);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, trigger, watch, formState: { errors } } = useForm<EditFormData>({
    defaultValues: {
      colonia: property.colonia,
      calle: property.calle ?? "",
      numero: property.numero ?? "",
      tipo_local: property.tipo_local,
      m2: property.m2,
      antiguedad: property.antiguedad ?? "",
      nivel_piso: property.nivel_piso ?? "",
      uso_anterior: property.uso_anterior ?? "",
      agua_drenaje: property.agua_drenaje ?? "",
      habitaciones: property.habitaciones,
      banos: property.banos,
      estacionamientos: property.estacionamientos,
      modalidad: property.modalidad ?? "",
      precio_inmueble: property.precio_inmueble ? String(property.precio_inmueble) : "",
      precio_mantenimiento: property.precio_mantenimiento ? String(property.precio_mantenimiento) : "",
      descripcion: property.descripcion ?? "",
    },
    mode: "onTouched",
  });

  const watchModalidad = watch("modalidad");
  const totalPhotos = keptPhotoUrls.length + newPhotos.length;

  const handleNewPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - totalPhotos;
    const toAdd = files.slice(0, remaining);
    setNewPhotos((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeKeptPhoto = (index: number) => setKeptPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    let fields: (keyof EditFormData)[] = [];
    if (activeStep === 0) fields = ["colonia"];
    if (activeStep === 1) fields = ["tipo_local", "m2", "nivel_piso"];
    const valid = await trigger(fields);
    if (valid) setActiveStep((s) => s + 1);
  };

  const onSubmit = async (data: EditFormData) => {
    if (totalPhotos === 0) {
      setPhotoError("Debes mantener al menos una foto.");
      return;
    }
    setPhotoError(null);
    setSubmitError(null);
    setSaving(true);

    // Upload new photos
    const newUrls: string[] = [];
    for (const file of newPhotos) {
      const ext = file.name.split(".").pop();
      const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await getSupabase().storage
        .from("property-photos")
        .upload(storagePath, file, { contentType: file.type });
      if (uploadError) {
        setSubmitError("Error al subir fotos. Intenta de nuevo.");
        setSaving(false);
        return;
      }
      const { data: urlData } = getSupabase().storage.from("property-photos").getPublicUrl(storagePath);
      newUrls.push(urlData.publicUrl);
    }

    const body = {
      colonia: data.colonia,
      calle: data.calle || null,
      numero: data.numero || null,
      lat: pinLocation?.lat ?? null,
      lng: pinLocation?.lng ?? null,
      tipo_local: data.tipo_local,
      m2: Number(data.m2),
      antiguedad: data.antiguedad !== "" ? Number(data.antiguedad) : null,
      nivel_piso: data.nivel_piso || null,
      uso_anterior: data.uso_anterior || null,
      agua_drenaje: data.agua_drenaje || null,
      habitaciones: data.habitaciones,
      banos: data.banos,
      estacionamientos: data.estacionamientos,
      modalidad: data.modalidad || null,
      precio_inmueble: data.precio_inmueble !== "" ? Number(data.precio_inmueble) : null,
      precio_mantenimiento: data.precio_mantenimiento !== "" ? Number(data.precio_mantenimiento) : null,
      descripcion: data.descripcion || null,
      photo_urls: [...keptPhotoUrls, ...newUrls],
    };

    const res = await fetch(`/api/properties/${property.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setSubmitError("No se pudo guardar. Intenta de nuevo.");
      setSaving(false);
      return;
    }

    router.push(`/propiedades/${property.id}`);
    router.refresh();
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400&display=swap');`}</style>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary", pb: 10 }}>
        <Box sx={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>

          {/* Header */}
          <Box mb={4}>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">
              Editar propiedad
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {property.colonia} · {property.tipo_local}
            </Typography>
          </Box>

          <Card elevation={0} sx={{ border: "1px solid #1e1e3e", borderRadius: 4, pt: 4, pb: 5, px: { xs: 3, md: 5 } }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6, "& .MuiStepConnector-line": { borderColor: "oklch(0.9 0.015 250)" } }}>
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ minHeight: 240, display: "flex", flexDirection: "column", gap: 3 }}>

                {/* STEP 1: UBICACIÓN */}
                <Box sx={{ display: activeStep === 0 ? "flex" : "none", flexDirection: "column", gap: 3 }}>
                  <Controller name="colonia" control={control} rules={{ required: "Campo requerido" }} render={({ field }) => (
                    <FormControl fullWidth error={!!errors.colonia}>
                      <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>NEIGHBORHOOD / DISTRICT *</InputLabel>
                      <TextField {...field} placeholder="Ej: Roma Norte, Condesa..." error={!!errors.colonia} />
                      {errors.colonia && <FormHelperText>{errors.colonia.message}</FormHelperText>}
                    </FormControl>
                  )} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Controller name="calle" control={control} render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>STREET <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                          <TextField {...field} placeholder="Ej: Av. Insurgentes Sur" />
                        </FormControl>
                      )} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Controller name="numero" control={control} render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>NUMBER <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                          <TextField {...field} placeholder="Ej: 123" />
                        </FormControl>
                      )} />
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "oklch(0.45 0.03 260)", letterSpacing: 1, fontSize: 13, display: "block", mb: 1 }}>
                      MAP LOCATION
                    </Typography>
                    <MapPicker
                      onLocationSelect={(lat, lng) => setPinLocation({ lat, lng })}
                      initialLat={pinLocation?.lat}
                      initialLng={pinLocation?.lng}
                      flyTo={null}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, fontFamily: "'DM Mono', monospace" }}>
                      Click en el mapa para mover el pin de ubicación
                    </Typography>
                  </Box>
                </Box>

                {/* STEP 2: CARACTERÍSTICAS */}
                <Box sx={{ display: activeStep === 1 ? "flex" : "none", flexDirection: "column", gap: 3 }}>
                  <Controller name="tipo_local" control={control} rules={{ required: "Campo requerido" }} render={({ field }) => (
                    <FormControl fullWidth error={!!errors.tipo_local}>
                      <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>PROPERTY TYPE *</InputLabel>
                      <Select {...field} displayEmpty>
                        <MenuItem value="" disabled>Select property type</MenuItem>
                        {TIPOS_LOCAL.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </Select>
                      {errors.tipo_local && <FormHelperText>{errors.tipo_local.message}</FormHelperText>}
                    </FormControl>
                  )} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Controller name="m2" control={control} rules={{ required: "Campo requerido", min: 1 }} render={({ field }) => (
                        <FormControl fullWidth error={!!errors.m2}>
                          <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>SIZE (m²) *</InputLabel>
                          <TextField {...field} type="number" placeholder="Ej: 45" />
                          {errors.m2 && <FormHelperText>{errors.m2.message}</FormHelperText>}
                        </FormControl>
                      )} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller name="antiguedad" control={control} render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>AGE (YEARS)</InputLabel>
                          <TextField {...field} type="number" placeholder="Ej: 10" />
                        </FormControl>
                      )} />
                    </Grid>
                  </Grid>
                  <Controller name="nivel_piso" control={control} rules={{ required: "Campo requerido" }} render={({ field }) => (
                    <FormControl fullWidth error={!!errors.nivel_piso}>
                      <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>FLOOR LEVEL *</InputLabel>
                      <Select {...field} displayEmpty>
                        <MenuItem value="" disabled>Select floor level...</MenuItem>
                        {NIVELES_PISO.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                      </Select>
                      {errors.nivel_piso && <FormHelperText>{errors.nivel_piso.message}</FormHelperText>}
                    </FormControl>
                  )} />
                  <Controller name="uso_anterior" control={control} render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>LAST USE <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                      <Select {...field} displayEmpty>
                        <MenuItem value="">Select last use...</MenuItem>
                        {USOS_ANTERIORES.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )} />
                </Box>

                {/* STEP 3: DETALLES */}
                <Box sx={{ display: activeStep === 2 ? "flex" : "none", flexDirection: "column", gap: 3 }}>

                  {/* Fotos */}
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", color: "var(--muted)", letterSpacing: 1, fontSize: 13 }}>
                        PHOTOS
                      </Typography>
                      <Typography component="span" variant="caption" sx={{ color: totalPhotos >= 1 ? "var(--brand)" : "var(--muted)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                        {totalPhotos} / 5
                      </Typography>
                    </Box>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleNewPhoto} />
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                      {/* Fotos existentes */}
                      {keptPhotoUrls.map((url, i) => (
                        <Box key={`kept-${i}`} sx={{ position: "relative", width: 90, height: 90, borderRadius: 2, overflow: "hidden", border: "1px solid var(--surface-border)", flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`foto-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <IconButton size="small" onClick={() => removeKeptPhoto(i)} sx={{ position: "absolute", top: 2, right: 2, bgcolor: "oklch(0.985 0.005 240 / 0.9)", color: "#e53935", width: 22, height: 22, fontSize: 14, "&:hover": { bgcolor: "oklch(0.985 0.005 240)" } }}>×</IconButton>
                        </Box>
                      ))}
                      {/* Fotos nuevas */}
                      {newPhotoPreviews.map((src, i) => (
                        <Box key={`new-${i}`} sx={{ position: "relative", width: 90, height: 90, borderRadius: 2, overflow: "hidden", border: "1px solid var(--surface-border)", flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`nueva-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, border: "2px solid oklch(0.55 0.11 250)", borderRadius: 2, pointerEvents: "none" }} />
                          <IconButton size="small" onClick={() => removeNewPhoto(i)} sx={{ position: "absolute", top: 2, right: 2, bgcolor: "oklch(0.985 0.005 240 / 0.9)", color: "#e53935", width: 22, height: 22, fontSize: 14, "&:hover": { bgcolor: "oklch(0.985 0.005 240)" } }}>×</IconButton>
                        </Box>
                      ))}
                      {/* Botón agregar */}
                      {totalPhotos < 5 && (
                        <Box onClick={() => fileInputRef.current?.click()} sx={{ width: 90, height: 90, borderRadius: 2, border: "1px dashed var(--surface-border)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, color: "var(--muted)", flexShrink: 0, "&:hover": { borderColor: "oklch(0.55 0.11 250)", color: "oklch(0.55 0.11 250)" }, transition: "all 0.15s" }}>
                          <Typography sx={{ fontSize: 24, lineHeight: 1 }}>+</Typography>
                          <Typography variant="caption" sx={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>Add photo</Typography>
                        </Box>
                      )}
                    </Box>
                    {photoError && <Typography variant="caption" color="error" sx={{ mt: 1, display: "block", fontFamily: "'DM Mono', monospace" }}>{photoError}</Typography>}
                  </Box>

                  <Controller name="descripcion" control={control} render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>DESCRIPTION <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                      <TextField {...field} multiline rows={3} placeholder="Describe el local: distribución, estado general, características especiales..." />
                    </FormControl>
                  )} />

                  <Controller name="agua_drenaje" control={control} render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>WATER AND DRAINAGE <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                      <Select {...field} displayEmpty>
                        <MenuItem value="">Select an option...</MenuItem>
                        <MenuItem value="Water and drainage complete">Water and drainage complete</MenuItem>
                        <MenuItem value="Water only">Water only</MenuItem>
                        <MenuItem value="Drainage only">Drainage only</MenuItem>
                        <MenuItem value="No connections">No connections</MenuItem>
                      </Select>
                    </FormControl>
                  )} />

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
                        <NumberStepper label="PARKING" value={field.value as number} onChange={field.onChange} />
                      )} />
                    </Grid>
                  </Grid>

                  <Controller name="modalidad" control={control} render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>LISTING TYPE <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                      <Select {...field} displayEmpty>
                        <MenuItem value="">Not specified</MenuItem>
                        <MenuItem value="sale">For sale</MenuItem>
                        <MenuItem value="rent">For rent</MenuItem>
                      </Select>
                    </FormControl>
                  )} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Controller name="precio_inmueble" control={control} render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>
                            {watchModalidad === "rent" ? "MONTHLY RENT (MXN)" : watchModalidad === "sale" ? "SALE PRICE (MXN)" : "PRICE (MXN)"}
                            {" "}<Typography component="span" variant="caption" color="text.secondary">(optional)</Typography>
                          </InputLabel>
                          <TextField {...field} type="number" placeholder={watchModalidad === "rent" ? "Ej: 15000" : "Ej: 2500000"} InputProps={{ startAdornment: <Typography variant="body2" color="text.secondary" mr={0.5}>$</Typography> }} />
                        </FormControl>
                      )} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller name="precio_mantenimiento" control={control} render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel shrink={false} sx={{ position: "relative", transform: "none", mb: 1 }}>MONTHLY MAINTENANCE (MXN) <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></InputLabel>
                          <TextField {...field} type="number" placeholder="Ej: 3500" InputProps={{ startAdornment: <Typography variant="body2" color="text.secondary" mr={0.5}>$</Typography> }} />
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

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 5, pt: 4, borderTop: "1px solid #1e1e3e" }}>
                <Button type="button" variant="outlined" onClick={() => setActiveStep((s) => s - 1)} sx={{ visibility: activeStep === 0 ? "hidden" : "visible" }}>
                  ← Previous
                </Button>
                {activeStep < steps.length - 1 ? (
                  <Button type="button" variant="contained" onClick={handleNext}>Next →</Button>
                ) : (
                  <Button variant="contained" type="submit" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
                    {saving ? "Guardando..." : "Guardar cambios →"}
                  </Button>
                )}
              </Box>
            </form>
          </Card>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
