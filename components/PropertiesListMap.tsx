'use client';

import { useEffect, useRef } from 'react';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

interface PropertiesListMapProps {
  pins: MapPin[];
}

// Default center: CDMX
const DEFAULT_CENTER: [number, number] = [19.4326, -99.1332];
const DEFAULT_ZOOM = 12;

export default function PropertiesListMap({ pins }: PropertiesListMapProps) {
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

    import('leaflet').then((L) => {
      if (destroyed || !mapRef.current) return;

      const el = mapRef.current as any;
      if (el._leaflet_id) delete el._leaflet_id;

      const map = L.map(mapRef.current!, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const valid = pins.filter((p) => p.lat != null && p.lng != null);

      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });

        valid.forEach((p) => {
          const dot = L.divIcon({
            html: `<div style="
              width:14px;height:14px;
              background:#0f1b3d;
              border-radius:50%;
              border:2.5px solid #ffffff;
              box-shadow:0 2px 8px rgba(15,27,61,0.35);
            "></div>`,
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const marker = L.marker([p.lat, p.lng], { icon: dot }).addTo(map);
          marker.bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#181e38;min-width:110px;padding:2px 0">${p.label}</div>`,
            { closeButton: false, offset: [0, -6], className: 'localiq-popup' }
          );
          marker.on('mouseover', () => marker.openPopup());
          marker.on('mouseout', () => marker.closePopup());
        });
      }

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
  }, [JSON.stringify(pins)]);

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #d5daea',
        boxShadow: '0 2px 16px rgba(15,27,61,0.07)',
      }}
    >
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .localiq-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(15,27,61,0.12);
          border: 1px solid #e4e7f4;
        }
        .localiq-popup .leaflet-popup-tip { display: none; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: 560 }} />
    </div>
  );
}
