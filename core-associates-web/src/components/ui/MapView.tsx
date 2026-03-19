'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  popup?: string;
  color?: 'blue' | 'red' | 'green' | 'orange';
  id?: string;
  iconType?: string;
}

interface MapViewProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  activeMarkerId?: string;
}

const MARKER_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  orange: '#f97316',
};

function createIcon(color: string, iconType?: string) {
  const fill = MARKER_COLORS[color] || MARKER_COLORS.blue;

  // Mini SVG symbols for each incident type (fit inside 12px white circle at center 14,14)
  const TIPO_INNER: Record<string, string> = {
    // Car: body + windshield
    accidente: `<rect x="9.5" y="14" width="9" height="3.5" rx="1.2" fill="${fill}"/><rect x="11" y="11.5" width="6" height="3" rx=".8" fill="${fill}"/>`,
    // Gavel: T-shape (post + crossbar)
    infraccion: `<rect x="13" y="10.5" width="2" height="7" rx=".6" fill="${fill}"/><rect x="10" y="10" width="8" height="2" rx=".6" fill="${fill}"/>`,
    // Shield outline
    robo: `<path d="M14 9.5l-4.5 2v3c0 2.8 4.5 4.5 4.5 4.5s4.5-1.7 4.5-4.5v-3L14 9.5z" fill="none" stroke="${fill}" stroke-width="1.4"/>`,
    // Warning triangle + exclamation
    asalto: `<path d="M14 9.5l-5 9h10z" fill="none" stroke="${fill}" stroke-width="1.2"/><line x1="14" y1="12.5" x2="14" y2="15.5" stroke="${fill}" stroke-width="1.2" stroke-linecap="round"/><circle cx="14" cy="17" r=".7" fill="${fill}"/>`,
    // Question mark
    otro: `<text x="14" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="${fill}" font-family="Arial,sans-serif">?</text>`,
  };

  const inner = iconType && TIPO_INNER[iconType]
    ? `<circle cx="14" cy="14" r="6.5" fill="#fff"/>${TIPO_INNER[iconType]}`
    : '<circle cx="14" cy="14" r="6" fill="#fff"/>';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${fill}" stroke="#fff" stroke-width="1.5"/>
    ${inner}
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

export function MapView({ markers, center, zoom = 13, className = '', height = '300px', onMarkerClick, activeMarkerId }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] =
      center || (markers.length > 0 ? [markers[0].lat, markers[0].lng] : [19.4326, -99.1332]);

    const map = L.map(containerRef.current, { attributionControl: false }).setView(defaultCenter, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: createIcon(m.color || 'blue', m.iconType) }).addTo(map);
      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(m));
      } else if (m.popup || m.label) {
        marker.bindPopup(`<strong>${m.label}</strong>${m.popup ? `<br/>${m.popup}` : ''}`);
      }
    });

    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], zoom);
    }
  }, [markers, zoom]);

  return (
    <div
      ref={containerRef}
      className={`relative z-0 w-full overflow-hidden rounded-lg ${className}`}
      style={{ height }}
    />
  );
}
