"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { PARIS_CENTER } from "@/constants/paris";

// Fix icônes Leaflet par défaut (Next.js casse les require de PNG).
// On utilise les icônes hébergées sur unpkg comme fallback fiable.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Marker SisterRun custom (pin violet avec halo)
function brandMarkerHtml(active = false) {
  const color = active ? "#EC4899" : "#7B2D8E";
  return `
    <div style="position:relative;width:34px;height:42px;">
      <div style="position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;">
        <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 0c9.4 0 17 7.6 17 17 0 11.5-15.2 23.6-17 25-1.8-1.4-17-13.5-17-25C0 7.6 7.6 0 17 0z" fill="${color}"/>
          <circle cx="17" cy="16" r="6" fill="white"/>
        </svg>
      </div>
      ${active ? '<div style="position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);width:30px;height:30px;border-radius:50%;background:rgba(236,72,153,.35);animation:pulseRing 1.6s ease-out infinite;"></div>' : ""}
    </div>
  `;
}

function brandIcon(active = false) {
  return L.divIcon({
    html: brandMarkerHtml(active),
    className: "sisterrun-marker",
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  });
}

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  active?: boolean;
  popup?: React.ReactNode;
};

export type MapPolyline = {
  id: string;
  positions: [number, number][]; // [lat, lng]
  color?: string;
};

export function MapView({
  markers = [],
  polylines = [],
  center = [PARIS_CENTER.lat, PARIS_CENTER.lng],
  zoom = 12,
  className,
  onMarkerClick,
}: {
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMarkerClick?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Force le redimensionnement quand le container apparaît dans un layout dynamique
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      // Permet à Leaflet de recalculer les tiles
      window.dispatchEvent(new Event("resize"));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const iconActive = useMemo(() => brandIcon(true), []);
  const iconDefault = useMemo(() => brandIcon(false), []);

  return (
    <div ref={containerRef} className={className ?? "h-full w-full"}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {polylines.map((p) => (
          <Polyline
            key={p.id}
            positions={p.positions}
            pathOptions={{ color: p.color ?? "#7B2D8E", weight: 4, opacity: 0.8 }}
          />
        ))}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={m.active ? iconActive : iconDefault}
            eventHandlers={{
              click: () => onMarkerClick?.(m.id),
            }}
          >
            {m.popup ? <Popup>{m.popup}</Popup> : null}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
