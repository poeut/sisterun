import { describe, it, expect } from "vitest";
import {
  validateKycInput,
  applyRandomRejection,
  MAX_FILE_BYTES,
  MIN_DIMENSION_PX,
  type KycInput,
} from "@/lib/kyc-mock";

const goodInput = (): KycInput => ({
  idCardFileName: "ci.jpg",
  idCardWidth: 800,
  idCardHeight: 500,
  idCardSizeBytes: 500_000,
  selfieFileName: "selfie.jpg",
  selfieWidth: 600,
  selfieHeight: 600,
  selfieSizeBytes: 300_000,
});

describe("validateKycInput", () => {
  it("accepte une entrée valide", () => {
    const r = validateKycInput(goodInput());
    expect(r.ok).toBe(true);
  });

  it("rejette si fichier manquant", () => {
    const r = validateKycInput({ ...goodInput(), idCardFileName: "" });
    expect(r.ok).toBe(false);
  });

  it("rejette si CI > 5 MB", () => {
    const r = validateKycInput({
      ...goodInput(),
      idCardSizeBytes: MAX_FILE_BYTES + 1,
    });
    expect(r.ok).toBe(false);
  });

  it("rejette si dimension < seuil", () => {
    const r = validateKycInput({
      ...goodInput(),
      selfieWidth: MIN_DIMENSION_PX - 1,
    });
    expect(r.ok).toBe(false);
  });

  it("rejette un numéro CI hors regex", () => {
    const r = validateKycInput({ ...goodInput(), idNumber: "??!" });
    expect(r.ok).toBe(false);
  });

  it("accepte un numéro CI valide", () => {
    const r = validateKycInput({ ...goodInput(), idNumber: "ABCD1234" });
    expect(r.ok).toBe(true);
  });
});

describe("applyRandomRejection", () => {
  it("ne modifie pas un échec préexistant", () => {
    const fail = { ok: false, reason: "x" } as const;
    expect(applyRandomRejection(fail, () => 0.01).ok).toBe(false);
  });

  it("rejette aléatoirement avec un random < 0.05", () => {
    const success = validateKycInput(goodInput());
    const r = applyRandomRejection(success, () => 0.01);
    expect(r.ok).toBe(false);
  });

  it("garde le succès quand random ≥ 0.05", () => {
    const success = validateKycInput(goodInput());
    const r = applyRandomRejection(success, () => 0.5);
    expect(r.ok).toBe(true);
  });
});
