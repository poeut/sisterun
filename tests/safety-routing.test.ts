import { describe, it, expect } from "vitest";
import {
  periodOfDay,
  scoreRoute,
  rankRoutes,
  type RouteSafetyInput,
} from "@/lib/safety-routing";

const route = (overrides: Partial<RouteSafetyInput> = {}): RouteSafetyInput => ({
  id: "r" + Math.random(),
  name: "test",
  distanceKm: 5,
  safetyScore: 80,
  bestTimeOfDay: "morning",
  lighting: 4,
  popularity: 4,
  ...overrides,
});

describe("periodOfDay", () => {
  it("matin : 6h → 11h59", () => {
    expect(periodOfDay(6)).toBe("morning");
    expect(periodOfDay(11)).toBe("morning");
  });
  it("après-midi : 12h → 17h59", () => {
    expect(periodOfDay(15)).toBe("afternoon");
  });
  it("soir : 18h → 21h59", () => {
    expect(periodOfDay(20)).toBe("evening");
  });
  it("nuit : 22h → 5h", () => {
    expect(periodOfDay(23)).toBe("night");
    expect(periodOfDay(2)).toBe("night");
  });
});

describe("scoreRoute", () => {
  it("score maximal lorsque tout matche", () => {
    const r = route({
      bestTimeOfDay: "morning",
      lighting: 5,
      popularity: 5,
    });
    expect(scoreRoute(r, 9)).toBeGreaterThanOrEqual(95);
  });

  it("pénalise une route nuit avec faible éclairage", () => {
    const dark = route({ bestTimeOfDay: "morning", lighting: 1, popularity: 3 });
    const bright = route({ bestTimeOfDay: "night", lighting: 5, popularity: 5 });
    expect(scoreRoute(bright, 23)).toBeGreaterThan(scoreRoute(dark, 23));
  });

  it("score borne entre 0 et 100", () => {
    const s = scoreRoute(route({ lighting: 0, popularity: 0 }), 23);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("rankRoutes", () => {
  it("trie par dynamicScore décroissant", () => {
    const r1 = route({ id: "a", lighting: 5, popularity: 5, bestTimeOfDay: "morning" });
    const r2 = route({ id: "b", lighting: 1, popularity: 1, bestTimeOfDay: "evening" });
    const r3 = route({ id: "c", lighting: 4, popularity: 3, bestTimeOfDay: "morning" });
    const ranked = rankRoutes([r2, r3, r1], 9);
    expect(ranked.map((r) => r.id)).toEqual(["a", "c", "b"]);
    expect(ranked[0].dynamicScore).toBeGreaterThanOrEqual(ranked[1].dynamicScore);
  });
});
