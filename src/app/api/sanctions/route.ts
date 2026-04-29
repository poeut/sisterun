import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const sanctions = await prisma.sanction.findMany({
    where: { userId: session.user.id },
    orderBy: { startsAt: "desc" },
  });
  return NextResponse.json({ sanctions });
}
