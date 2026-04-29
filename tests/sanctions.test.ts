import { describe, it, expect } from "vitest";
import { decideSanctions } from "@/lib/sanctions";

describe("decideSanctions — règles métier", () => {
  it("1er signalement validé sans parrain → WARNING simple", () => {
    const r = decideSanctions({
      reportedValidatedCount: 1,
      hasSponsor: false,
      sponsorPriorValidatedCount: 0,
    });
    expect(r.reportedAction).toBe("WARNING");
    expect(r.sponsorAction).toBe("NONE");
  });

  it("3e signalement validé → PERMANENT_BAN sur la personne signalée", () => {
    const r = decideSanctions({
      reportedValidatedCount: 3,
      hasSponsor: false,
      sponsorPriorValidatedCount: 0,
    });
    expect(r.reportedAction).toBe("PERMANENT_BAN");
  });

  it("1er filleul signalé d'un parrain → SPONSOR_BLOCK_6M", () => {
    const r = decideSanctions({
      reportedValidatedCount: 1,
      hasSponsor: true,
      sponsorPriorValidatedCount: 0,
    });
    expect(r.sponsorAction).toBe("SPONSOR_BLOCK_6M");
    expect(r.reportedAction).toBe("WARNING");
  });

  it("2e filleul signalé d'un parrain → ban permanent du parrain", () => {
    const r = decideSanctions({
      reportedValidatedCount: 1,
      hasSponsor: true,
      sponsorPriorValidatedCount: 1,
    });
    expect(r.sponsorAction).toBe("PERMANENT_BAN");
  });

  it("Combine ban personne signalée (3e) + ban parrain (2e filleul)", () => {
    const r = decideSanctions({
      reportedValidatedCount: 3,
      hasSponsor: true,
      sponsorPriorValidatedCount: 1,
    });
    expect(r.reportedAction).toBe("PERMANENT_BAN");
    expect(r.sponsorAction).toBe("PERMANENT_BAN");
    expect(r.notes.length).toBeGreaterThan(0);
  });
});
