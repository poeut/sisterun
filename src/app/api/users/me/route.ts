import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      phone: true,
      bio: true,
      level: true,
      photoUrl: true,
      verified: true,
      verifiedAt: true,
      role: true,
      premium: true,
      sponsorBlockedUntil: true,
      banned: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (typeof body.firstName === "string") allowed.firstName = body.firstName;
  if (typeof body.lastName === "string") allowed.lastName = body.lastName;
  if (typeof body.bio === "string" || body.bio === null) allowed.bio = body.bio;
  if (typeof body.phone === "string" || body.phone === null) allowed.phone = body.phone;
  if (["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(body.level)) {
    allowed.level = body.level;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: allowed,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      bio: true,
      phone: true,
      level: true,
    },
  });
  return NextResponse.json({ user });
}
