"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  CheckCircle2,
  IdCard,
  Camera,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Step = "intro" | "id" | "selfie" | "submit" | "processing" | "ok" | "ko";

type FilePayload = {
  file: File;
  width: number;
  height: number;
  preview: string;
};

async function readImage(file: File): Promise<FilePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () =>
        resolve({
          file,
          width: img.naturalWidth,
          height: img.naturalHeight,
          preview: dataUrl,
        });
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function KycPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState<Step>("intro");
  const [idDoc, setIdDoc] = useState<FilePayload | null>(null);
  const [selfie, setSelfie] = useState<FilePayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleFile =
    (kind: "id" | "selfie") => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        const payload = await readImage(f);
        if (kind === "id") {
          setIdDoc(payload);
          setStep("selfie");
        } else {
          setSelfie(payload);
          setStep("submit");
        }
      } catch (err) {
        console.error(err);
        toast.error("Impossible de lire l'image.");
      }
    };

  const submit = async () => {
    if (!idDoc || !selfie) return;
    setStep("processing");

    const fd = new FormData();
    fd.append("idCard", idDoc.file);
    fd.append("idCardWidth", String(idDoc.width));
    fd.append("idCardHeight", String(idDoc.height));
    fd.append("selfie", selfie.file);
    fd.append("selfieWidth", String(selfie.width));
    fd.append("selfieHeight", String(selfie.height));

    try {
      const res = await fetch("/api/kyc/verify", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.reason || data.error || "Vérification refusée.");
        setStep("ko");
        return;
      }
      // Met à jour le JWT pour refléter verified=true
      await update();
      setStep("ok");
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur réseau.");
      setStep("ko");
    }
  };

  const reset = () => {
    setIdDoc(null);
    setSelfie(null);
    setErrorMsg(null);
    setStep("intro");
  };

  return (
    <main className="flex min-h-screen flex-col px-6 pt-8 pb-10">
      <header className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <ShieldCheck className="h-3.5 w-3.5" /> Vérification d&apos;identité
        </div>
        <h1 className="text-3xl font-bold text-brand-900">
          On sécurise la communauté ensemble
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une pièce d&apos;identité + un selfie. Documents stockés chiffrés,
          jamais partagés.
        </p>
      </header>

      {step === "intro" ? (
        <Intro onStart={() => setStep("id")} />
      ) : null}

      {step === "id" ? (
        <CapturePane
          title="Étape 1/2 — Pièce d'identité"
          help="Carte nationale ou passeport. Cadre bien les 4 coins."
          icon={<IdCard className="h-8 w-8 text-brand-600" />}
          onPick={() => idInputRef.current?.click()}
          buttonLabel="Photographier ma pièce"
        />
      ) : null}
      <input
        ref={idInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile("id")}
      />

      {step === "selfie" ? (
        <CapturePane
          title="Étape 2/2 — Selfie"
          help="Bien éclairée, regard caméra. On compare avec ta CI."
          icon={<Camera className="h-8 w-8 text-brand-600" />}
          onPick={() => selfieInputRef.current?.click()}
          buttonLabel="Prendre un selfie"
          preview={idDoc?.preview}
        />
      ) : null}
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFile("selfie")}
      />

      {step === "submit" ? (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold">Tout est prêt ?</h2>
          <div className="grid grid-cols-2 gap-3">
            <PreviewBox label="Pièce d'identité" url={idDoc?.preview} />
            <PreviewBox label="Selfie" url={selfie?.preview} />
          </div>
          <Button className="w-full" onClick={submit}>
            Lancer la vérification
          </Button>
          <Button variant="ghost" className="w-full" onClick={reset}>
            Recommencer
          </Button>
        </div>
      ) : null}

      {step === "processing" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-500" />
          <h2 className="text-lg font-semibold">Analyse en cours…</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparaison du selfie et de la pièce d&apos;identité (≈ 3 s).
          </p>
        </div>
      ) : null}

      {step === "ok" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
          <h2 className="text-2xl font-bold">Tu es vérifiée 🎉</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bienvenue dans la communauté. Tu peux maintenant rejoindre des courses.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => {
              router.push("/map");
              router.refresh();
            }}
          >
            Découvrir les courses
          </Button>
        </div>
      ) : null}

      {step === "ko" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <XCircle className="mb-4 h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Vérification refusée</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {errorMsg || "Une erreur est survenue."}
          </p>
          <Button className="mt-6 w-full" onClick={reset}>
            Réessayer
          </Button>
        </div>
      ) : null}
    </main>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8 space-y-3 rounded-2xl border border-border bg-card p-4">
        <Bullet text="Photo nette de ta pièce d'identité (CNI ou passeport)." />
        <Bullet text="Selfie en lumière naturelle." />
        <Bullet text="Analyse automatique en 3 secondes." />
        <Bullet text="Données chiffrées, jamais partagées." />
      </div>
      <Button className="mt-auto w-full" onClick={onStart}>
        Commencer
      </Button>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function CapturePane({
  title,
  help,
  icon,
  onPick,
  buttonLabel,
  preview,
}: {
  title: string;
  help: string;
  icon: React.ReactNode;
  onPick: () => void;
  buttonLabel: string;
  preview?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
          {icon}
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{help}</p>
      </div>
      {preview ? (
        <p className="mb-4 text-center text-xs text-muted-foreground">
          ✅ Pièce d&apos;identité enregistrée. Maintenant le selfie.
        </p>
      ) : null}
      <Button className="mt-auto w-full" onClick={onPick}>
        {buttonLabel}
      </Button>
    </div>
  );
}

function PreviewBox({ label, url }: { label: string; url?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-32 w-full object-cover" />
      ) : (
        <div className="flex h-32 items-center justify-center bg-muted text-xs text-muted-foreground">
          —
        </div>
      )}
      <div className="bg-card px-3 py-2 text-xs font-medium">{label}</div>
    </div>
  );
}
