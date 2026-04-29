import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const id = session.user.id;

  // Suppression en cascade (ordre : enfants → parents)
  await prisma.message.deleteMany({ where: { userId: id } });
  await prisma.checkIn.deleteMany({ where: { userId: id } });
  await prisma.sosAlert.deleteMany({ where: { userId: id } });
  await prisma.participation.deleteMany({ where: { userId: id } });
  await prisma.report.deleteMany({
    where: { OR: [{ reporterId: id }, { reportedId: id }] },
  });
  await prisma.sanction.deleteMany({ where: { userId: id } });
  await prisma.sponsorship.deleteMany({
    where: { OR: [{ sponsorId: id }, { sponsoredId: id }] },
  });
  await prisma.emergencyContact.deleteMany({ where: { userId: id } });
  // Annule ses runs en cours
  await prisma.run.updateMany({
    where: { organizerId: id, status: { in: ["SCHEDULED", "ACTIVE"] } },
    data: { status: "CANCELLED" },
  });
  // Anonymise les runs passés (on garde la trace pour les autres)
  await prisma.run.updateMany({
    where: { organizerId: id },
    data: { description: "[Compte supprimé]" },
  });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
