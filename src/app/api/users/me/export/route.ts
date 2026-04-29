import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const data = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organizedRuns: true,
      participations: { include: { run: true } },
      sponsorshipsGiven: { include: { sponsored: { select: { firstName: true, lastName: true } } } },
      sponsorshipsReceived: { include: { sponsor: { select: { firstName: true, lastName: true } } } },
      reportsMade: true,
      reportsReceived: true,
      sanctions: true,
      messages: true,
      emergencyContacts: true,
      checkIns: true,
      sosAlerts: true,
    },
  });
  if (!data) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  // On retire les hashs de mot de passe et URLs internes sensibles
  const { passwordHash: _pw, ...rest } = data;
  void _pw;

  return new NextResponse(JSON.stringify(rest, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sisterrun-export-${data.id}.json"`,
    },
  });
}
