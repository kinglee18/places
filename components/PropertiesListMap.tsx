'use client';

import { useEffect, useRef } from 'react';
import { cartoTileUrl } from '@/lib/mapTiles';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** Marker fill color (defaults to brand navy). */
  color?: string;
  /** Extra popup line, e.g. competition level or price. */
  sublabel?: string;
  /** If set, clicking the marker navigates here. */
  href?: string;
}

interface PropertiesListMapProps {
  pins: MapPin[];
  /** Browser geolocation of the visitor; shown as a distinct marker and included in bounds. */
  userLocation?: { lat: number; lng: number } | null;
  userLocationLabel?: string;
  height?: number;
}

// Default center: CDMX
const DEFAULT_CENTER: [number, number] = [19.4326, -99.1332];
const DEFAULT_ZOOM = 12;

export default function PropertiesListMap({
  pins,
  userLocation = null,
  userLocationLabel,
  height = 560,
}: PropertiesListMapProps) {
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
        center: userLocation ? [userLocation.lat, userLocation.lng] : DEFAULT_CENTER,
        zoom: userLocation ? 14 : DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
      });

      L.tileLayer(cartoTileUrl('light_all'), {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const valid = pins.filter((p) => p.lat != null && p.lng != null);

      const boundPoints: [number, number][] = valid.map((p) => [p.lat, p.lng]);
      if (userLocation) boundPoints.push([userLocation.lat, userLocation.lng]);

      if (boundPoints.length > 0) {
        const bounds = L.latLngBounds(boundPoints);
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      }

      if (userLocation) {
        const userDot = L.divIcon({
          html: `<div style="
            width:16px;height:16px;
            background:#2563eb;
            border-radius:50%;
            border:3px solid #ffffff;
            box-shadow:0 0 0 4px rgba(37,99,235,0.25), 0 2px 8px rgba(15,27,61,0.35);
          "></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userDot,
          zIndexOffset: 1000,
        }).addTo(map);
        if (userLocationLabel) {
          userMarker.bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#181e38;padding:2px 0">${userLocationLabel}</div>`,
            { closeButton: false, offset: [0, -6], className: 'plaziia-popup' }
          );
          userMarker.on('mouseover', () => userMarker.openPopup());
          userMarker.on('mouseout', () => userMarker.closePopup());
        }
      }

      valid.forEach((p) => {
        const fill = p.color ?? '#0f1b3d';
        const dot = L.divIcon({
          html: `<div style="
            width:14px;height:14px;
            background:${fill};
            border-radius:50%;
            border:2.5px solid #ffffff;
            box-shadow:0 2px 8px rgba(15,27,61,0.35);
            ${p.href ? 'cursor:pointer;' : ''}
          "></div>`,
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([p.lat, p.lng], { icon: dot }).addTo(map);
        const sublabelHtml = p.sublabel
          ? `<div style="font-family:Inter,sans-serif;font-size:11px;font-weight:500;color:#5a6288;margin-top:2px">${p.sublabel}</div>`
          : '';
        marker.bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#181e38;min-width:110px;padding:2px 0">${p.label}${sublabelHtml}</div>`,
          { closeButton: false, offset: [0, -6], className: 'plaziia-popup' }
        );
        marker.on('mouseover', () => marker.openPopup());
        marker.on('mouseout', () => marker.closePopup());
        if (p.href) {
          marker.on('click', () => {
            window.location.href = p.href!;
          });
        }
      });

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
  }, [JSON.stringify(pins), userLocation?.lat, userLocation?.lng]);

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
        .plaziia-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(15,27,61,0.12);
          border: 1px solid #e4e7f4;
        }
        .plaziia-popup .leaflet-popup-tip { display: none; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height }} />
    </div>
  );
}
