// KYC mocké pour le prototype.
// Une vraie implémentation ferait appel à un service comme Onfido / Veriff.
// MOCK PROTOTYPE : on simule une analyse de pièce d'identité + selfie.

const ID_CARD_REGEX_FR = /^[A-Z0-9]{8,14}$/i; // numéro CNI fr (mocké)

export type KycInput = {
  idCardFileName: string;
  idCardWidth: number;
  idCardHeight: number;
  idCardSizeBytes: number;
  selfieFileName: string;
  selfieWidth: number;
  selfieHeight: number;
  selfieSizeBytes: number;
  // Numéro CI optionnel (saisi par l'utilisatrice)
  idNumber?: string;
};

export type KycResult =
  | { ok: true; verifiedAt: Date }
  | { ok: false; reason: string };

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MIN_DIMENSION_PX = 200;

/**
 * Logique de validation pure (sans I/O ni délai) pour pouvoir être testée.
 */
export function validateKycInput(input: KycInput): KycResult {
  if (!input.idCardFileName || !input.selfieFileName) {
    return { ok: false, reason: "Fichier manquant (CI ou selfie)." };
  }
  if (input.idCardSizeBytes > MAX_FILE_BYTES) {
    return { ok: false, reason: "Pièce d'identité trop volumineuse (>5 MB)." };
  }
  if (input.selfieSizeBytes > MAX_FILE_BYTES) {
    return { ok: false, reason: "Selfie trop volumineux (>5 MB)." };
  }
  if (
    input.idCardWidth < MIN_DIMENSION_PX ||
    input.idCardHeight < MIN_DIMENSION_PX
  ) {
    return {
      ok: false,
      reason: "Pièce d'identité illisible (résolution trop faible).",
    };
  }
  if (
    input.selfieWidth < MIN_DIMENSION_PX ||
    input.selfieHeight < MIN_DIMENSION_PX
  ) {
    return { ok: false, reason: "Selfie illisible (résolution trop faible)." };
  }
  if (input.idNumber && !ID_CARD_REGEX_FR.test(input.idNumber)) {
    return { ok: false, reason: "Numéro de pièce d'identité invalide." };
  }
  return { ok: true, verifiedAt: new Date() };
}

/**
 * Applique un refus aléatoire dans 5 % des cas pour démontrer le flow d'échec.
 * Utilise un random injectable pour la testabilité.
 */
export function applyRandomRejection(
  base: KycResult,
  rng: () => number = Math.random
): KycResult {
  if (!base.ok) return base;
  if (rng() < 0.05) {
    return {
      ok: false,
      reason:
        "Vérification automatique échouée — soumets à nouveau les documents.",
    };
  }
  return base;
}

/**
 * Délai artificiel pour simuler une analyse (uniquement côté API route).
 */
export async function simulateProcessingDelay(ms = 3000): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}
