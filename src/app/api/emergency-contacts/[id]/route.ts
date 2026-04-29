import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const found = await prisma.emergencyContact.findUnique({
    where: { id: params.id },
  });
  if (!found || found.userId !== session.user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await prisma.emergencyContact.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
