'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CDMX_CENTER: [number, number] = [19.4326, -99.1332];

function createIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="#fff"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
  });
}

interface MapLocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

export function MapLocationPicker({ lat, lng, onChange, height = '250px' }: MapLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const updateMarker = useCallback((map: L.Map, latlng: L.LatLng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng(latlng);
    } else {
      markerRef.current = L.marker(latlng, { icon: createIcon(), draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        onChangeRef.current(
          Math.round(pos.lat * 1e8) / 1e8,
          Math.round(pos.lng * 1e8) / 1e8,
        );
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = lat && lng ? [lat, lng] : CDMX_CENTER;
    const map = L.map(containerRef.current).setView(center, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    if (lat && lng) {
      updateMarker(map, L.latLng(lat, lng));
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      updateMarker(map, e.latlng);
      onChangeRef.current(
        Math.round(e.latlng.lat * 1e8) / 1e8,
        Math.round(e.latlng.lng * 1e8) / 1e8,
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync marker when lat/lng change externally (e.g. manual input)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !lat || !lng) return;
    const latlng = L.latLng(lat, lng);
    updateMarker(map, latlng);
    map.setView(latlng, map.getZoom());
  }, [lat, lng, updateMarker]);

  return (
    <div>
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-lg border border-gray-300"
        style={{ height }}
      />
      <p className="mt-1 text-xs text-gray-400">Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación</p>
    </div>
  );
}
