import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runSchema } from "@/lib/validators";
import { isInsideParis } from "@/lib/geo";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // SCHEDULED|ACTIVE|COMPLETED|CANCELLED
  const level = searchParams.get("level");
  const mine = searchParams.get("mine") === "1";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (level) where.level = level;
  if (mine) {
    where.OR = [
      { organizerId: session.user.id },
      { participations: { some: { userId: session.user.id } } },
    ];
  }

  const runs = await prisma.run.findMany({
    where,
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
    include: {
      organizer: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true, verified: true, level: true },
      },
      route: { select: { id: true, name: true, distanceKm: true, safetyScore: true } },
      _count: { select: { participations: true } },
      participations: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
  });

  const dto = runs.map((r) => ({
    ...r,
    isParticipant: r.participations.length > 0,
    participantsCount: r._count.participations,
    participations: undefined,
    _count: undefined,
  }));

  return NextResponse.json({ runs: dto });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  if (!session.user.verified) {
    return NextResponse.json(
      { error: "Profil non vérifié — termine le KYC d'abord." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (!isInsideParis(data.startLat, data.startLng)) {
    return NextResponse.json(
      { error: "Le point de départ doit être dans Paris intra-muros." },
      { status: 400 }
    );
  }

  const run = await prisma.run.create({
    data: {
      organizerId: session.user.id,
      title: data.title,
      description: data.description ?? null,
      startLat: data.startLat,
      startLng: data.startLng,
      startAddress: data.startAddress,
      scheduledAt: new Date(data.scheduledAt),
      durationMin: data.durationMin,
      level: data.level,
      maxParticipants: data.maxParticipants,
      routeId: data.routeId || null,
      status: "SCHEDULED",
    },
  });

  // L'organisatrice est ajoutée automatiquement comme participante
  await prisma.participation.create({
    data: { userId: session.user.id, runId: run.id },
  });

  return NextResponse.json({ run }, { status: 201 });
}
