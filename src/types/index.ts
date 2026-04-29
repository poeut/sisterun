// Types partagés frontend/backend.
// Les types Prisma sont importables directement depuis "@prisma/client" ;
// ce fichier ajoute les DTO et types utilitaires non-Prisma.

export type GeoPoint = { lat: number; lng: number };

export type RouteGeoJson = {
  type: "LineString";
  coordinates: [number, number][]; // [lng, lat]
};

export type RunWithDetails = {
  id: string;
  title: string;
  description: string | null;
  startLat: number;
  startLng: number;
  startAddress: string;
  scheduledAt: string;
  durationMin: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  maxParticipants: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  organizer: PublicUser;
  participantsCount: number;
  isParticipant?: boolean;
  hasCheckedIn?: boolean;
};

export type PublicUser = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  verified: boolean;
};

export type SosEvent = {
  alertId: string;
  userId: string;
  userName: string;
  runId: string;
  lat: number;
  lng: number;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  runId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  content: string;
  createdAt: string;
};
