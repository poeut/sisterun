"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  Camera,
  Users as UsersIcon,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckInCamera } from "@/components/safety/CheckInCamera";
import { ChatBox } from "@/components/chat/ChatBox";
import { SOSButton } from "@/components/safety/SOSButton";
import { initials, formatTime, relativeFromNow } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";

type RunDetail = {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startLat: number;
  startLng: number;
  startAddress: string;
  organizerId: string;
  isParticipant: boolean;
  isOrganizer: boolean;
  hasCheckedIn: boolean;
  participantsCount: number;
  participations: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      photoUrl: string | null;
    };
  }>;
};

export default function ActiveRunPage() {
  const params = useParams<{ id: string }>();
  const runId = params.id;
  const router = useRouter();
  const { data: session } = useSession();
  const [run, setRun] = useState<RunDetail | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const reload = () =>
    fetch(`/api/runs/${runId}`)
      .then((r) => r.json())
      .then((d) => setRun(d.run))
      .catch(() => toast.error("Erreur de chargement."));

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  // Écoute des alertes SOS sur ce run
  useRealtime<{ sos?: { userName: string; lat: number; lng: number } }>({
    channel: `run-${runId}`,
    event: "sos",
    pollUrl: `/api/runs/${runId}/sos`,
    pollIntervalMs: 4000,
    onEvent: (data) => {
      if (data?.sos) {
        toast.error(
          `🚨 SOS de ${data.sos.userName} — position partagée avec les participantes.`,
          { duration: 10000 }
        );
        try {
          // bip sonore léger
          const ctx = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.value = 880;
          o.connect(ctx.destination);
          o.start();
          o.stop(ctx.currentTime + 0.4);
        } catch {
          /* ignore */
        }
      }
    },
  });

  if (!run || !session) {
    return (
      <main className="px-4 py-8">
        <div className="h-32 animate-pulse rounded-2xl bg-brand-50" />
      </main>
    );
  }

  if (!run.isParticipant && !run.isOrganizer) {
    return (
      <main className="px-6 py-10 text-center">
        <p className="mb-4">Tu dois rejoindre la course pour accéder à cette page.</p>
        <Button asChild>
          <Link href={`/runs/${runId}`}>Voir la course</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="pb-32">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card px-4 py-3">
        <Link href={`/runs/${runId}`} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold">{run.title}</h1>
          <p className="text-xs text-muted-foreground">
            {run.status === "ACTIVE" ? "En cours" : `Départ ${relativeFromNow(run.scheduledAt)}`}
          </p>
        </div>
      </header>

      {/* Bandeau check-in */}
      <section className="px-4 py-4">
        {run.hasCheckedIn ? (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="flex items-center gap-3 p-4">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Check-in confirmé
                </p>
                <p className="text-xs text-emerald-800">
                  Tes contacts d&apos;urgence savent que tu as démarré la course.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : showCamera ? (
          <CheckInCamera
            runId={runId}
            onDone={() => {
              setShowCamera(false);
              reload();
              router.refresh();
            }}
          />
        ) : (
          <Card className="border-accent/40 bg-accent/5">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-accent-700">Check-in photo</p>
                <p className="text-xs text-foreground">
                  Confirme ta présence par un selfie au point de RDV.
                </p>
              </div>
              <Button variant="accent" onClick={() => setShowCamera(true)}>
                <Camera className="mr-2 h-4 w-4" /> Lancer
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Infos rapides */}
      <section className="grid grid-cols-2 gap-2 px-4">
        <Stat icon={<Clock className="h-4 w-4" />} value={formatTime(run.scheduledAt)} label="Départ" />
        <Stat icon={<UsersIcon className="h-4 w-4" />} value={`${run.participantsCount}`} label="Participantes" />
      </section>

      {/* Participantes */}
      <section className="px-4 pt-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Participantes
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {run.participations.map((p) => (
            <div
              key={p.user.id}
              className="flex shrink-0 flex-col items-center gap-1 text-xs"
            >
              <Avatar className="h-12 w-12">
                {p.user.photoUrl ? (
                  <AvatarImage src={p.user.photoUrl} alt={p.user.firstName} />
                ) : null}
                <AvatarFallback>{initials(p.user.firstName, p.user.lastName)}</AvatarFallback>
              </Avatar>
              <span className="max-w-[60px] truncate">{p.user.firstName}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Chat */}
      <section className="px-4 pt-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Chat de la course
        </h2>
        <ChatBox runId={runId} currentUserId={session.user.id} />
      </section>

      {/* Bouton SOS sticky bas droite */}
      <SOSButton runId={runId} />
    </main>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </span>
        <div>
          <div className="text-lg font-semibold">{value}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
