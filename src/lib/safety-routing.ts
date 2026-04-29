// Score de sécurité d'un parcours en fonction de l'heure courante.
// Formule : 0.4 * lighting (norm. 0-100) + 0.3 * popularity (norm. 0-100)
//         + 0.3 * adéquation horaire (0 ou 100).

export type RouteSafetyInput = {
  id: string;
  name: string;
  distanceKm: number;
  safetyScore: number;     // score statique stocké en BDD (0-100)
  bestTimeOfDay: string;   // morning | afternoon | evening | night
  lighting: number;        // 0-5
  popularity: number;      // 0-5
};

export type ScoredRoute = RouteSafetyInput & { dynamicScore: number };

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export function periodOfDay(hour: number): DayPeriod {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

/**
 * Score dynamique d'un parcours pour l'heure passée en argument.
 * Renvoie un nombre entre 0 et 100.
 */
export function scoreRoute(route: RouteSafetyInput, atHour: number): number {
  const period = periodOfDay(atHour);
  const lightingNorm = (route.lighting / 5) * 100;
  const popularityNorm = (route.popularity / 5) * 100;

  // Adéquation horaire : exact => 100. Voisin (matin/après-midi) => 60.
  // Période nocturne mais lighting < 4 => fortement pénalisé.
  const adequacy = computeAdequacy(period, route.bestTimeOfDay as DayPeriod);

  let score = 0.4 * lightingNorm + 0.3 * popularityNorm + 0.3 * adequacy;

  // Pénalité forte la nuit si éclairage insuffisant
  if (period === "night" && route.lighting < 4) {
    score *= 0.6;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

function computeAdequacy(now: DayPeriod, best: DayPeriod): number {
  if (now === best) return 100;
  const order: DayPeriod[] = ["morning", "afternoon", "evening", "night"];
  const dist = Math.abs(order.indexOf(now) - order.indexOf(best));
  if (dist === 1) return 60;
  if (dist === 2) return 30;
  return 10;
}

export function rankRoutes(
  routes: RouteSafetyInput[],
  atHour: number
): ScoredRoute[] {
  return routes
    .map((r) => ({ ...r, dynamicScore: scoreRoute(r, atHour) }))
    .sort((a, b) => b.dynamicScore - a.dynamicScore);
}
