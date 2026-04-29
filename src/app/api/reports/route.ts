import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const reports = await prisma.report.findMany({
    where: { reporterId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      reported: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
    },
  });
  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Signalement invalide" },
      { status: 400 }
    );
  }
  if (parsed.data.reportedId === session.user.id) {
    return NextResponse.json(
      { error: "Tu ne peux pas te signaler toi-même." },
      { status: 400 }
    );
  }
  const reported = await prisma.user.findUnique({
    where: { id: parsed.data.reportedId },
  });
  if (!reported) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: session.user.id,
      reportedId: parsed.data.reportedId,
      reason: parsed.data.reason,
      comment: parsed.data.comment ?? null,
    },
  });

  // Email mock pour l'admin
  console.log(
    `[ADMIN-EMAIL MOCK] Nouveau signalement #${report.id} contre ${reported.firstName} ${reported.lastName} (motif: ${parsed.data.reason})`
  );

  return NextResponse.json({ report }, { status: 201 });
}
