import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Users as UsersIcon,
  ShieldCheck,
  Sparkles,
  Camera,
  AlertTriangle,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge, VerifiedBadge } from "@/components/profile/VerifiedBadge";
import { JoinButton } from "@/components/runs/JoinButton";
import { ChatBox } from "@/components/chat/ChatBox";
import { ReportDialog } from "@/components/safety/ReportDialog";
import MapViewClient from "@/components/map/MapView.client";
import { initials, formatDateTime, relativeFromNow } from "@/lib/utils";
import { CHECKIN_WINDOW_MIN } from "@/constants/config";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const run = await prisma.run.findUnique({
    where: { id: params.id },
    include: {
      organizer: true,
      route: true,
      participations: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
      checkIns: {
        where: { userId: session.user.id },
        select: { id: true, photoUrl: true },
      },
    },
  });
  if (!run) notFound();

  const isParticipant = run.participations.some(
    (p) => p.userId === session.user.id
  );
  const isOrganizer = run.organizerId === session.user.id;
  const hasCheckedIn = run.checkIns.length > 0;
  const isFull = run.participations.length >= run.maxParticipants;
  const isFinished = run.status === "COMPLETED" || run.status === "CANCELLED";

  // Fenêtre check-in
  const start = run.scheduledAt.getTime();
  const checkInOpensAt = start - CHECKIN_WINDOW_MIN * 60_000;
  const checkInClosesAt = start + run.durationMin * 60_000;
  const now = Date.now();
  const checkInOpen =
    isParticipant &&
    !hasCheckedIn &&
    now >= checkInOpensAt &&
    now <= checkInClosesAt;

  const isLive = run.status === "ACTIVE";

  // Polyline du parcours associé (si existe)
  let polyPositions: [number, number][] | null = null;
  if (run.route) {
    try {
      const geo = JSON.parse(run.route.geoJson) as {
        type: string;
        coordinates: [number, number][];
      };
      polyPositions = geo.coordinates.map(([lng, lat]) => [lat, lng]);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="pb-10">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card px-4 py-3">
        <Link href="/runs" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold">{run.title}</h1>
      </header>

      {/* Mini-carte du point de départ + parcours */}
      <div className="h-48 w-full">
        <MapViewClient
          center={[run.startLat, run.startLng]}
          zoom={14}
          markers={[{ id: run.id, lat: run.startLat, lng: run.startLng, active: isLive }]}
          polylines={
            polyPositions
              ? [{ id: "route", positions: polyPositions, color: "#7B2D8E" }]
              : []
          }
        />
      </div>

      {/* Bandeau statut */}
      <section className="px-4 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {isLive ? (
            <Badge variant="accent" className="gap-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              En cours
            </Badge>
          ) : null}
          <LevelBadge level={run.level} />
          {run.route ? (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Sécurité {run.route.safetyScore}/100
            </Badge>
          ) : null}
          {isParticipant ? (
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Inscrite
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-600" />
            <span>
              {formatDateTime(run.scheduledAt)} ·{" "}
              <span className="text-muted-foreground">
                {relativeFromNow(run.scheduledAt)} · {run.durationMin} min
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-600" />
            <span>{run.startAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-brand-600" />
            <span>
              {run.participations.length}/{run.maxParticipants} participantes
            </span>
          </div>
          {run.route ? (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span>
                {run.route.name} · {run.route.distanceKm} km
              </span>
            </div>
          ) : null}
        </div>

        {run.description ? (
          <p className="mt-3 rounded-2xl border border-border bg-card p-4 text-sm">
            {run.description}
          </p>
        ) : null}
      </section>

      {/* Organisatrice */}
      <section className="px-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Organisée par
        </h2>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Avatar className="h-12 w-12">
              {run.organizer.photoUrl ? (
                <AvatarImage src={run.organizer.photoUrl} alt={run.organizer.firstName} />
              ) : null}
              <AvatarFallback>{initials(run.organizer.firstName, run.organizer.lastName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {run.organizer.firstName} {run.organizer.lastName}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {run.organizer.verified ? <VerifiedBadge /> : null}
                <LevelBadge level={run.organizer.level} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Participantes */}
      <section className="px-4 pt-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Participantes ({run.participations.length})
        </h2>
        <div className="space-y-2">
          {run.participations.map((p) => {
            const isMe = p.userId === session.user.id;
            return (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <Avatar className="h-9 w-9">
                    {p.user.photoUrl ? (
                      <AvatarImage src={p.user.photoUrl} alt={p.user.firstName} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {initials(p.user.firstName, p.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {p.user.firstName} {p.user.lastName}
                      {p.userId === run.organizerId ? (
                        <span className="ml-1 text-[10px] text-brand-700">
                          · organisatrice
                        </span>
                      ) : null}
                      {isMe ? (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          · toi
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {p.user.verified ? <VerifiedBadge /> : null}
                      <LevelBadge level={p.user.level} />
                    </div>
                  </div>
                  {!isMe ? (
                    <ReportDialog
                      reportedId={p.user.id}
                      reportedName={`${p.user.firstName} ${p.user.lastName}`}
                    />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Bandeau check-in */}
      {isParticipant ? (
        <section className="px-4 pt-4">
          {hasCheckedIn ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="flex items-center gap-3 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900">Check-in validé</p>
                  <p className="text-xs text-emerald-800">
                    Tu peux maintenant accéder à la course en cours.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : checkInOpen ? (
            <Card className="border-accent/40 bg-accent/5">
              <CardContent className="flex items-start gap-3 p-4">
                <Camera className="mt-0.5 h-5 w-5 text-accent-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-accent-700">
                    Check-in disponible
                  </p>
                  <p className="text-xs text-foreground">
                    Prends une photo selfie pour confirmer ta présence.
                  </p>
                </div>
                <Button asChild size="sm" variant="accent">
                  <Link href={`/runs/${run.id}/active`}>Check-in</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold">Check-in à venir</p>
                  <p className="text-xs text-muted-foreground">
                    Disponible 10 min avant le départ.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      ) : null}

      {/* Action principale */}
      <section className="px-4 pt-4">
        <JoinButton
          runId={run.id}
          isParticipant={isParticipant}
          isOrganizer={isOrganizer}
          isFull={isFull}
          isFinished={isFinished}
        />
        {isParticipant || isOrganizer ? (
          <Button asChild className="mt-2 w-full" variant="accent">
            <Link href={`/runs/${run.id}/active`}>
              Vue course en cours
            </Link>
          </Button>
        ) : null}
      </section>

      {/* Chat */}
      {(isParticipant || isOrganizer) && !isFinished ? (
        <section className="px-4 pt-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Chat de la course
          </h2>
          <ChatBox runId={run.id} currentUserId={session.user.id} />
        </section>
      ) : null}
    </main>
  );
}
