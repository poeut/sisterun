import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validators";
import { broadcast } from "@/lib/pusher";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }

  // L'utilisatrice doit être participante OU organisatrice
  const part = await prisma.participation.findFirst({
    where: { userId: session.user.id, runId: params.id },
  });
  const run = await prisma.run.findUnique({ where: { id: params.id } });
  if (!part && run?.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisée" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { runId: params.id },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  });
  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  }

  const part = await prisma.participation.findFirst({
    where: { userId: session.user.id, runId: params.id },
  });
  const run = await prisma.run.findUnique({ where: { id: params.id } });
  if (!run) {
    return NextResponse.json({ error: "Course introuvable" }, { status: 404 });
  }
  if (!part && run.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisée" }, { status: 403 });
  }

  const msg = await prisma.message.create({
    data: {
      runId: params.id,
      userId: session.user.id,
      content: parsed.data.content,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  });

  // Broadcast realtime (ou no-op si pas de clé)
  await broadcast(`run-${params.id}`, "chat-message", { message: msg });

  return NextResponse.json({ message: msg }, { status: 201 });
}
