import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }

  const run = await prisma.run.findUnique({
    where: { id: params.id },
    include: {
      organizer: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true, verified: true, level: true, bio: true },
      },
      route: true,
      participations: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, photoUrl: true, verified: true, level: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      checkIns: {
        where: { userId: session.user.id },
        select: { id: true, photoUrl: true, createdAt: true },
      },
    },
  });
  if (!run) {
    return NextResponse.json({ error: "Course introuvable" }, { status: 404 });
  }

  const isParticipant = run.participations.some(
    (p) => p.userId === session.user.id
  );
  const isOrganizer = run.organizerId === session.user.id;
  const hasCheckedIn = run.checkIns.length > 0;

  return NextResponse.json({
    run: {
      ...run,
      isParticipant,
      isOrganizer,
      hasCheckedIn,
      participantsCount: run.participations.length,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const run = await prisma.run.findUnique({ where: { id: params.id } });
  if (!run) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (
    run.organizerId !== session.user.id &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "MODERATOR"
  ) {
    return NextResponse.json({ error: "Non autorisée" }, { status: 403 });
  }
  await prisma.run.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });
  return NextResponse.json({ ok: true });
}
