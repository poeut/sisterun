import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  validateKycInput,
  applyRandomRejection,
  simulateProcessingDelay,
} from "@/lib/kyc-mock";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function persistFile(file: File, userId: string, kind: "id" | "selfie") {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
  const fname = `${userId}-${kind}-${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, fname), buf);
  return `/uploads/${fname}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const idFile = form.get("idCard");
    const selfieFile = form.get("selfie");
    const idNumber = (form.get("idNumber") as string | null) || undefined;
    const idCardWidth = Number(form.get("idCardWidth") ?? 0);
    const idCardHeight = Number(form.get("idCardHeight") ?? 0);
    const selfieWidth = Number(form.get("selfieWidth") ?? 0);
    const selfieHeight = Number(form.get("selfieHeight") ?? 0);

    if (!(idFile instanceof File) || !(selfieFile instanceof File)) {
      return NextResponse.json(
        { error: "Fichiers manquants (idCard et selfie requis)." },
        { status: 400 }
      );
    }

    const validation = validateKycInput({
      idCardFileName: idFile.name,
      idCardWidth,
      idCardHeight,
      idCardSizeBytes: idFile.size,
      selfieFileName: selfieFile.name,
      selfieWidth,
      selfieHeight,
      selfieSizeBytes: selfieFile.size,
      idNumber,
    });

    // Délai artificiel pour simuler l'analyse (3s)
    await simulateProcessingDelay(3000);
    const final = applyRandomRejection(validation);

    if (!final.ok) {
      return NextResponse.json({ ok: false, reason: final.reason }, { status: 422 });
    }

    const idCardUrl = await persistFile(idFile, session.user.id, "id");
    const selfieUrl = await persistFile(selfieFile, session.user.id, "selfie");

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        idCardUrl,
        selfieUrl,
        verified: true,
        verifiedAt: final.verifiedAt,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[kyc]", e);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification." },
      { status: 500 }
    );
  }
}
