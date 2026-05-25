"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  flyTo?: { lat: number; lng: number } | null;
}

const DEFAULT_LAT = 19.4326; // CDMX centro
const DEFAULT_LNG = -99.1332;

export default function MapPicker({ onLocationSelect, initialLat, initialLng, flyTo }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    if (!mapRef.current) return;

    // Guard against React Strict Mode double-invocation:
    // Leaflet leaves _leaflet_id on the container even after .remove(), so
    // we need to delete it before re-initialising.
    let destroyed = false;
    const container = mapRef.current as any;
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }
    if (leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
      markerRef.current = null;
    }

    // Dynamically import leaflet only on client
    import("leaflet").then((L) => {
      if (destroyed || !mapRef.current) return;

      // Fix default icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const startLat = initialLat ?? DEFAULT_LAT;
      const startLng = initialLng ?? DEFAULT_LNG;

      // Clear Leaflet id one more time in case the async resolved late
      const el = mapRef.current as any;
      if (el._leaflet_id) delete el._leaflet_id;

      const map = L.map(mapRef.current!, {
        center: [startLat, startLng],
        zoom: 14,
        zoomControl: true,
      });

      // Light tile layer (CartoDB Positron)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      // Custom neon green icon
      const customIcon = L.divIcon({
        html: `
          <div style="
            width: 32px; height: 32px;
            background: linear-gradient(135deg, #00f5a0, #00b4d8);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff33;
            box-shadow: 0 0 12px rgba(0,245,160,0.6), 0 2px 8px rgba(0,0,0,0.5);
          "></div>
        `,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      // Place initial marker if coords exist
      if (initialLat && initialLng) {
        markerRef.current = L.marker([initialLat, initialLng], { icon: customIcon, draggable: true }).addTo(map);
        markerRef.current.on("dragend", (e: any) => {
          const pos = e.target.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          onLocationSelect(pos.lat, pos.lng);
        });
      }

      // Click to place / move marker
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(map);
          markerRef.current.on("dragend", (ev: any) => {
            const pos = ev.target.getLatLng();
            setCoords({ lat: pos.lat, lng: pos.lng });
            onLocationSelect(pos.lat, pos.lng);
          });
        }
        setCoords({ lat, lng });
        onLocationSelect(lat, lng);
      });

      leafletMap.current = map;
    });

    return () => {
      destroyed = true;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current = null;
      }
      // Remove leftover Leaflet attribute so next init doesn't throw
      if (mapRef.current) {
        delete (mapRef.current as any)._leaflet_id;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan + place marker when the parent selects a location from autocomplete
  useEffect(() => {
    if (!flyTo || !leafletMap.current) return;
    const { lat, lng } = flyTo;

    import('leaflet').then((L) => {
      if (!leafletMap.current) return;

      leafletMap.current.setView([lat, lng], 15, { animate: true });

      const customIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#00f5a0,#00b4d8);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #ffffff33;box-shadow:0 0 12px rgba(0,245,160,0.6),0 2px 8px rgba(0,0,0,0.5);"></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(leafletMap.current);
        markerRef.current.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          onLocationSelect(pos.lat, pos.lng);
        });
      }
      setCoords({ lat, lng });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo]);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #d5daea" }}>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      <div ref={mapRef} style={{ width: "100%", height: 280 }} />

      {/* Overlay hint */}
      {!coords && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.92)",
            border: "1px solid #d5daea",
            borderRadius: 8,
            padding: "6px 14px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            backdropFilter: "blur(4px)",
          }}
        >
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "oklch(0.45 0.03 260)" }}>
            📍 Click the map to place your pin
          </span>
        </div>
      )}

      {/* Coords badge */}
      {coords && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,245,160,0.12)",
            border: "1px solid rgba(0,245,160,0.3)",
            borderRadius: 8,
            padding: "5px 12px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            backdropFilter: "blur(4px)",
          }}
        >
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "oklch(0.55 0.11 250)" }}>
            ✓ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
}
