// Logique métier des sanctions automatiques.
// Déclenchée quand un Report passe à VALIDATED.
//
// Règles :
//   1. Si la personne signalée a un parrain, on regarde l'historique du parrain :
//        - 1er signalement validé d'un de ses filleuls       → SPONSOR_BLOCK_6M
//        - 2e signalement validé d'un de ses filleuls       → PERMANENT_BAN
//   2. La personne signalée elle-même reçoit :
//        - WARNING au 1er signalement validé
//        - PERMANENT_BAN au 3e signalement validé

import { prisma } from "./prisma";

export const SPONSOR_BLOCK_DURATION_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~6 mois

export type SanctionSummary = {
  sponsorAction?: "SPONSOR_BLOCK_6M" | "PERMANENT_BAN" | "NONE";
  reportedAction: "WARNING" | "PERMANENT_BAN" | "NONE";
  notes: string[];
};

/**
 * Calcule (sans persister) les sanctions à appliquer en fonction de l'état
 * actuel des compteurs. Rend la fonction testable indépendamment de la BDD.
 */
export function decideSanctions(state: {
  reportedValidatedCount: number;       // nombre total de Report VALIDATED contre la personne signalée
  hasSponsor: boolean;
  sponsorPriorValidatedCount: number;   // nb de Report VALIDATED parmi les filleuls du parrain (avant celui-ci)
}): SanctionSummary {
  const notes: string[] = [];
  let reportedAction: SanctionSummary["reportedAction"] = "WARNING";

  if (state.reportedValidatedCount >= 3) {
    reportedAction = "PERMANENT_BAN";
    notes.push("Bannissement permanent : 3e signalement validé.");
  } else if (state.reportedValidatedCount === 1) {
    notes.push("Avertissement : 1er signalement validé.");
  } else {
    notes.push("Signalement validé supplémentaire (≥2 sans seuil ban).");
  }

  let sponsorAction: SanctionSummary["sponsorAction"] = "NONE";
  if (state.hasSponsor) {
    if (state.sponsorPriorValidatedCount === 0) {
      sponsorAction = "SPONSOR_BLOCK_6M";
      notes.push("Parrain bloqué 6 mois : 1er filleul signalé validé.");
    } else {
      sponsorAction = "PERMANENT_BAN";
      notes.push("Parrain banni : 2e filleul signalé validé.");
    }
  }

  return { sponsorAction, reportedAction, notes };
}

/**
 * Applique les sanctions à un Report passant à VALIDATED.
 * Persiste les changements en BDD : User flags, Sanction rows.
 */
export async function applySanctionsForValidatedReport(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { reported: true },
  });
  if (!report) throw new Error("Report introuvable.");
  if (report.status !== "VALIDATED") {
    throw new Error("Le rapport n'est pas marqué VALIDATED.");
  }

  const reportedValidatedCount = await prisma.report.count({
    where: { reportedId: report.reportedId, status: "VALIDATED" },
  });

  // Cherche un parrain de la personne signalée
  const sponsorship = await prisma.sponsorship.findFirst({
    where: { sponsoredId: report.reportedId },
  });
  const sponsor = sponsorship
    ? await prisma.user.findUnique({ where: { id: sponsorship.sponsorId } })
    : null;

  let sponsorPriorValidatedCount = 0;
  if (sponsor) {
    const sponsoredIds = await prisma.sponsorship.findMany({
      where: { sponsorId: sponsor.id },
      select: { sponsoredId: true },
    });
    sponsorPriorValidatedCount = await prisma.report.count({
      where: {
        reportedId: { in: sponsoredIds.map((s) => s.sponsoredId) },
        status: "VALIDATED",
        id: { not: reportId },
      },
    });
  }

  const decision = decideSanctions({
    reportedValidatedCount,
    hasSponsor: !!sponsor,
    sponsorPriorValidatedCount,
  });

  // Sanction sur la personne signalée
  if (decision.reportedAction === "WARNING") {
    await prisma.sanction.create({
      data: {
        userId: report.reportedId,
        type: "WARNING",
        reason: `Avertissement automatique suite au signalement #${report.id}`,
      },
    });
  } else if (decision.reportedAction === "PERMANENT_BAN") {
    await prisma.sanction.create({
      data: {
        userId: report.reportedId,
        type: "PERMANENT_BAN",
        reason: `Bannissement automatique (3e signalement validé) — rapport #${report.id}`,
      },
    });
    await prisma.user.update({
      where: { id: report.reportedId },
      data: {
        banned: true,
        bannedAt: new Date(),
        banReason: "Bannissement automatique : 3 signalements validés",
      },
    });
  }

  // Sanction éventuelle sur le parrain
  if (sponsor && decision.sponsorAction === "SPONSOR_BLOCK_6M") {
    const endsAt = new Date(Date.now() + SPONSOR_BLOCK_DURATION_MS);
    await prisma.sanction.create({
      data: {
        userId: sponsor.id,
        type: "SPONSOR_BLOCK_6M",
        reason: `Filleul signalé (rapport #${report.id})`,
        endsAt,
      },
    });
    await prisma.user.update({
      where: { id: sponsor.id },
      data: { sponsorBlockedUntil: endsAt },
    });
  } else if (sponsor && decision.sponsorAction === "PERMANENT_BAN") {
    await prisma.sanction.create({
      data: {
        userId: sponsor.id,
        type: "PERMANENT_BAN",
        reason: `2e filleul signalé validé (rapport #${report.id})`,
      },
    });
    await prisma.user.update({
      where: { id: sponsor.id },
      data: {
        banned: true,
        bannedAt: new Date(),
        banReason: "Bannissement automatique : 2 filleuls signalés validés",
      },
    });
  }

  return decision;
}
