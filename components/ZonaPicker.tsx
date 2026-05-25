"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Autocomplete as MuiAutocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";

interface LocationOption {
  label: string;
  placeId: string;
  lat: number;
  lng: number;
}

interface ZonaPickerProps {
  /** Called whenever the user selects a place or drops a pin */
  onChange: (value: { label: string; lat: number; lng: number } | null) => void;
}

const DEFAULT_LAT = 19.4326;
const DEFAULT_LNG = -99.1332;
const DEFAULT_ZOOM = 11;

export default function ZonaPicker({ onChange }: ZonaPickerProps) {
  // ── Autocomplete state ─────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Map / pin state ────────────────────────────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ── Search suggestions via /api/autocomplete ───────────────────────────────
  const search = useCallback((q: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (q.trim().length < 2) { setOptions([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
        const { predictions } = await res.json();
        setOptions(predictions ?? []);
      } catch { /* silent */ }
      setLoading(false);
    }, 300);
  }, []);

  // ── Init Leaflet map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let destroyed = false;

    const container = mapContainerRef.current as any;
    if (container._leaflet_id) delete container._leaflet_id;
    if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; markerRef.current = null; }

    import("leaflet").then((L) => {
      if (destroyed || !mapContainerRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const el = mapContainerRef.current as any;
      if (el._leaflet_id) delete el._leaflet_id;

      const map = L.map(mapContainerRef.current!, {
        center: [DEFAULT_LAT, DEFAULT_LNG],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      // Custom neon icon
      const neonIcon = (L: any) => L.divIcon({
        html: `<div style="
          width:32px;height:32px;
          background:linear-gradient(135deg,#00f5a0,#00b4d8);
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          border:2px solid #ffffff33;
          box-shadow:0 0 12px rgba(0,245,160,0.6),0 2px 8px rgba(0,0,0,0.5);
        "></div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      const placeMarker = (lat: number, lng: number) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: neonIcon(L), draggable: true }).addTo(map);
          markerRef.current.on("dragend", (e: any) => {
            const pos = e.target.getLatLng();
            setCoords({ lat: pos.lat, lng: pos.lng });
            onChange({ label: inputValue || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`, lat: pos.lat, lng: pos.lng });
          });
        }
      };

      // Expose placeMarker so autocomplete can call it
      (map as any)._placeMarker = placeMarker;

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        placeMarker(lat, lng);
        setCoords({ lat, lng });
        // Use current input text as label if available, otherwise coords string
        setInputValue((prev) => prev || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        onChange({ label: inputValue || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
      });

      leafletMap.current = map;
    });

    return () => {
      destroyed = true;
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; markerRef.current = null; }
      if (mapContainerRef.current) delete (mapContainerRef.current as any)._leaflet_id;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── When user picks a suggestion: fly + place pin ─────────────────────────
  const handleSelect = (_: unknown, val: LocationOption | string | null) => {
    if (!val || typeof val === "string") {
      if (!val) onChange(null);
      return;
    }
    const { label, lat, lng } = val;
    setInputValue(label);
    setCoords({ lat, lng });
    onChange({ label, lat, lng });

    if (leafletMap.current) {
      leafletMap.current.flyTo([lat, lng], 14, { duration: 1.2 });
      const placeMarker = (leafletMap.current as any)._placeMarker;
      if (placeMarker) placeMarker(lat, lng);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Autocomplete input */}
      <MuiAutocomplete
        freeSolo
        options={options}
        getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
        loading={loading}
        inputValue={inputValue}
        onInputChange={(_, val, reason) => {
          setInputValue(val);
          if (reason === "input") search(val);
          if (!val) onChange(null);
        }}
        onChange={handleSelect}
        filterOptions={(x) => x}
        renderOption={(props, option) => {
          const opt = option as LocationOption;
          return (
            <li {...props} key={opt.placeId} style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, padding: "10px 16px" }}>
              <span style={{ marginRight: 8, opacity: 0.5 }}>📍</span>
              {opt.label}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search city, neighborhood or area — anywhere in the world"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={16} sx={{ color: "oklch(0.55 0.11 250)" }} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {/* Map */}
      <Box sx={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #2a2a4a" }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: 260 }} />

        {/* Hint overlay */}
        {!coords && (
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            background: "rgba(10,10,20,0.85)", border: "1px solid #2a2a4a",
            borderRadius: 8, padding: "6px 14px", pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "oklch(0.45 0.03 260)" }}>
              📍 Search above or click the map to place your pin
            </span>
          </div>
        )}

        {/* Coords badge */}
        {coords && (
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,245,160,0.12)", border: "1px solid rgba(0,245,160,0.3)",
            borderRadius: 8, padding: "5px 12px", pointerEvents: "none", whiteSpace: "nowrap",
            backdropFilter: "blur(4px)",
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "oklch(0.55 0.11 250)" }}>
              ✓ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          </div>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
        Search or click the map · you can drag the pin to adjust · optional
      </Typography>
    </Box>
  );
}
