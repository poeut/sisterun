export const APP_NAME = "SisterRun";
export const APP_TAGLINE = "Courez ensemble. En sécurité.";

export const RUN_LEVELS = {
  BEGINNER: { label: "Débutante", description: "≤ 5 km, allure tranquille" },
  INTERMEDIATE: { label: "Intermédiaire", description: "5-10 km, allure soutenue" },
  ADVANCED: { label: "Confirmée", description: "≥ 10 km, allure rapide" },
} as const;

export const REPORT_REASONS = {
  HARASSMENT: "Harcèlement / propos déplacés",
  INAPPROPRIATE_BEHAVIOR: "Comportement inapproprié",
  FAKE_PROFILE: "Profil suspect / faux compte",
  SAFETY_ISSUE: "Problème de sécurité",
  OTHER: "Autre",
} as const;

export const CHECKIN_WINDOW_MIN = 10; // ouverture caméra check-in 10 min avant départ
export const SOS_RING_RADIUS_M = 500;
