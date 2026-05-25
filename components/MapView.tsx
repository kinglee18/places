"use client";

import { useEffect, useRef } from "react";

export interface IsochroneFeature {
  type: "Feature";
  properties: { value: number };
  geometry: { type: "Polygon"; coordinates: number[][][] };
}

interface MapViewProps {
  lat: number;
  lng: number;
  isochrones?: IsochroneFeature[];
}

const RING_STYLE: Record<number, { color: string; fillOpacity: number }> = {
  300: { color: "oklch(0.45 0.12 250)", fillOpacity: 0.15 },
  600: { color: "oklch(0.55 0.1 240)",  fillOpacity: 0.10 },
  900: { color: "#6b5ce7",              fillOpacity: 0.06 },
};

export default function MapView({ lat, lng, isochrones }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    let destroyed = false;
    const container = mapRef.current as any;
    if (container._leaflet_id) delete container._leaflet_id;
    if (leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
    }

    import("leaflet").then((L) => {
      if (destroyed || !mapRef.current) return;
      const el = mapRef.current as any;
      if (el._leaflet_id) delete el._leaflet_id;

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: false,
      });

      // Light tile layer (CartoDB Positron)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      if (isochrones && isochrones.length > 0) {
        [...isochrones]
          .sort((a, b) => b.properties.value - a.properties.value)
          .forEach((feature) => {
            const style = RING_STYLE[feature.properties.value] ?? { color: "#888", fillOpacity: 0.08 };
            L.geoJSON(feature as any, {
              style: {
                color: style.color,
                weight: 1.5,
                fillColor: style.color,
                fillOpacity: style.fillOpacity,
              },
            }).addTo(map);
          });
      }

      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#0f1b3d,#3b6fa0);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid rgba(255,255,255,0.6);box-shadow:0 2px 10px rgba(15,27,61,0.35),0 2px 8px rgba(0,0,0,0.15);"></div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([lat, lng], { icon }).addTo(map);
      leafletMap.current = map;
    });

    return () => {
      destroyed = true;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
      if (mapRef.current) delete (mapRef.current as any)._leaflet_id;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, isochrones]);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #d5daea" }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: "100%", height: 300 }} />
    </div>
  );
}
