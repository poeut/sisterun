import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Non autorisée" }, { status: 403 });
  }

  const [pending, validated, rejected] = await Promise.all([
    prisma.report.findMany({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        reported: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            verified: true,
            banned: true,
          },
        },
      },
    }),
    prisma.report.count({ where: { status: "VALIDATED" } }),
    prisma.report.count({ where: { status: "REJECTED" } }),
  ]);

  const usersBanned = await prisma.user.count({ where: { banned: true } });

  return NextResponse.json({
    pending,
    counters: { pending: pending.length, validated, rejected, usersBanned },
  });
}
