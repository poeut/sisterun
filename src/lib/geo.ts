import { PARIS_BBOX } from "@/constants/paris";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isInsideParis(lat: number, lng: number): boolean {
  return (
    lat >= PARIS_BBOX.minLat &&
    lat <= PARIS_BBOX.maxLat &&
    lng >= PARIS_BBOX.minLng &&
    lng <= PARIS_BBOX.maxLng
  );
}

// Géocodage mocké : associe une chaîne d'adresse à un quartier connu de Paris.
// Pour le prototype, suffisant pour démontrer la création de course.
import { PARIS_LANDMARKS } from "@/constants/paris";

export function mockGeocode(address: string): { lat: number; lng: number } {
  const lower = address.toLowerCase();
  const found = PARIS_LANDMARKS.find((l) =>
    lower.includes(l.name.toLowerCase().split(" ")[0])
  );
  if (found) return { lat: found.lat, lng: found.lng };
  // Sinon, point aléatoire centré sur Paris (déterministe via hash simple)
  const hash = Array.from(address).reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((hash % 100) - 50) / 1000;
  return { lat: 48.8566 + jitter, lng: 2.3522 + jitter };
}
