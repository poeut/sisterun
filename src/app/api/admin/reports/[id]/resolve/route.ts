import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applySanctionsForValidatedReport } from "@/lib/sanctions";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Non autorisée" }, { status: 403 });
  }

  const body = await req.json();
  const decision: "VALIDATED" | "REJECTED" = body.decision;
  if (decision !== "VALIDATED" && decision !== "REJECTED") {
    return NextResponse.json({ error: "Décision invalide" }, { status: 400 });
  }
  const note: string | undefined = body.note;

  const report = await prisma.report.update({
    where: { id: params.id },
    data: {
      status: decision,
      resolution: note ?? (decision === "VALIDATED" ? "Validé par modération." : "Rejeté."),
      resolvedAt: new Date(),
    },
  });

  let summary: unknown = null;
  if (decision === "VALIDATED") {
    summary = await applySanctionsForValidatedReport(report.id);
  }

  return NextResponse.json({ report, summary });
}
