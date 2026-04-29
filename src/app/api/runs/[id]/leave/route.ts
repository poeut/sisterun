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
  const run = await prisma.run.findUnique({ where: { id: params.id } });
  if (!run) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (run.organizerId === session.user.id) {
    return NextResponse.json(
      { error: "L'organisatrice ne peut pas quitter sa course (annule-la plutôt)." },
      { status: 400 }
    );
  }
  await prisma.participation.deleteMany({
    where: { userId: session.user.id, runId: run.id },
  });
  return NextResponse.json({ ok: true });
}
