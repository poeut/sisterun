import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/pusher";

// GET — fallback polling : retourne les alertes non résolues du run
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const alerts = await prisma.sosAlert.findMany({
    where: { runId: params.id, resolved: false },
    orderBy: { createdAt: "desc" },
    take: 1,
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });
  if (alerts.length === 0) return NextResponse.json({ sos: null });
  const a = alerts[0];
  return NextResponse.json({
    sos: {
      alertId: a.id,
      userName: `${a.user.firstName} ${a.user.lastName}`,
      lat: a.lat,
      lng: a.lng,
      createdAt: a.createdAt,
    },
  });
}

// POST — déclenche une alerte SOS
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
  }

  const run = await prisma.run.findUnique({ where: { id: params.id } });
  if (!run) {
    return NextResponse.json({ error: "Course introuvable" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { emergencyContacts: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const alert = await prisma.sosAlert.create({
    data: {
      userId: user.id,
      runId: run.id,
      lat,
      lng,
    },
  });

  // Broadcast realtime à toutes les participantes
  await broadcast(`run-${run.id}`, "sos", {
    sos: {
      alertId: alert.id,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      runId: run.id,
      lat,
      lng,
      createdAt: alert.createdAt,
    },
  });

  // Email mock aux contacts d'urgence (console.log en dev)
  if (process.env.EMAIL_MOCK === "true" || !process.env.EMAIL_MOCK) {
    for (const c of user.emergencyContacts) {
      console.log(
        `[SOS-EMAIL MOCK] À: ${c.name} <${c.email || c.phone}> | ${user.firstName} ${user.lastName} a déclenché une alerte SOS pendant la course "${run.title}". Position: https://maps.google.com/?q=${lat},${lng}`
      );
    }
  }

  return NextResponse.json({ ok: true, alertId: alert.id });
}

// PATCH — résout une alerte
export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  await prisma.sosAlert.updateMany({
    where: { runId: params.id, resolved: false },
    data: { resolved: true, resolvedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
