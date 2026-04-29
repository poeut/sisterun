import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

  const run = await prisma.run.findUnique({
    where: { id: params.id },
    include: { _count: { select: { participations: true } } },
  });
  if (!run) {
    return NextResponse.json({ error: "Course introuvable" }, { status: 404 });
  }
  if (run.status === "CANCELLED" || run.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Cette course est terminée." },
      { status: 400 }
    );
  }
  if (run._count.participations >= run.maxParticipants) {
    return NextResponse.json(
      { error: "La course est complète." },
      { status: 400 }
    );
  }

  const existing = await prisma.participation.findUnique({
    where: { userId_runId: { userId: session.user.id, runId: run.id } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyJoined: true });
  }

  await prisma.participation.create({
    data: { userId: session.user.id, runId: run.id },
  });
  return NextResponse.json({ ok: true });
}
