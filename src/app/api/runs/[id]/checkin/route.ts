import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHECKIN_WINDOW_MIN } from "@/constants/config";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }

  const run = await prisma.run.findUnique({ where: { id: params.id } });
  if (!run) {
    return NextResponse.json({ error: "Course introuvable" }, { status: 404 });
  }

  const part = await prisma.participation.findFirst({
    where: { userId: session.user.id, runId: params.id },
  });
  if (!part) {
    return NextResponse.json(
      { error: "Tu dois rejoindre la course avant le check-in." },
      { status: 403 }
    );
  }

  // Fenêtre check-in : 10 min avant le départ → fin de la course
  const now = Date.now();
  const start = run.scheduledAt.getTime();
  const end = start + run.durationMin * 60_000;
  if (
    now < start - CHECKIN_WINDOW_MIN * 60_000 ||
    now > end
  ) {
    return NextResponse.json(
      {
        error: `Check-in disponible 10 min avant le départ jusqu'à la fin de la course.`,
      },
      { status: 400 }
    );
  }

  try {
    const form = await req.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File)) {
      return NextResponse.json({ error: "Photo manquante" }, { status: 400 });
    }
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = (photo.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
    const fname = `${session.user.id}-checkin-${Date.now()}.${ext}`;
    await fs.writeFile(
      path.join(UPLOAD_DIR, fname),
      Buffer.from(await photo.arrayBuffer())
    );

    // Upsert (en cas de re-check-in, on remplace)
    const checkin = await prisma.checkIn.upsert({
      where: { userId_runId: { userId: session.user.id, runId: params.id } },
      update: { photoUrl: `/uploads/${fname}`, verified: true },
      create: {
        userId: session.user.id,
        runId: params.id,
        photoUrl: `/uploads/${fname}`,
        verified: true,
      },
    });
    // Si la course était SCHEDULED et qu'on est dans la fenêtre, passe-la ACTIVE
    if (run.status === "SCHEDULED" && now >= start - 5 * 60_000) {
      await prisma.run.update({
        where: { id: params.id },
        data: { status: "ACTIVE" },
      });
    }
    return NextResponse.json({ checkin });
  } catch (e) {
    console.error("[checkin]", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
