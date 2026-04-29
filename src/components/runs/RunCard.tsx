import Link from "next/link";
import { MapPin, Users as UsersIcon, Clock, Sparkles, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge } from "@/components/profile/VerifiedBadge";
import { initials, formatDateTime, relativeFromNow } from "@/lib/utils";

type RunCardData = {
  id: string;
  title: string;
  startAddress: string;
  scheduledAt: string | Date;
  durationMin: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  maxParticipants: number;
  participantsCount: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  isParticipant?: boolean;
  organizer: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    verified: boolean;
  };
  route?: { name: string; distanceKm: number; safetyScore: number } | null;
};

export function RunCard({ run }: { run: RunCardData }) {
  const placesLeft = Math.max(0, run.maxParticipants - run.participantsCount);
  const isFull = placesLeft === 0;
  const isLive = run.status === "ACTIVE";

  return (
    <Link href={`/runs/${run.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
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
            {run.isParticipant ? (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Inscrite
              </Badge>
            ) : null}
            {run.route ? (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" /> Sécurité {run.route.safetyScore}
              </Badge>
            ) : null}
          </div>

          <h3 className="text-base font-semibold leading-tight text-foreground">
            {run.title}
          </h3>

          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {formatDateTime(run.scheduledAt)} · {relativeFromNow(run.scheduledAt)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{run.startAddress}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UsersIcon className="h-3.5 w-3.5" />
              <span>
                {run.participantsCount}/{run.maxParticipants} ·{" "}
                {isFull ? (
                  <span className="font-medium text-destructive">Complet</span>
                ) : (
                  <span className="font-medium text-emerald-700">
                    {placesLeft} place{placesLeft > 1 ? "s" : ""}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <Avatar className="h-7 w-7">
              {run.organizer.photoUrl ? (
                <AvatarImage src={run.organizer.photoUrl} alt={run.organizer.firstName} />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {initials(run.organizer.firstName, run.organizer.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Organisée par <span className="font-medium text-foreground">{run.organizer.firstName}</span>
              {run.organizer.verified ? (
                <ShieldCheck className="ml-1 inline-block h-3 w-3 text-emerald-600" />
              ) : null}
            </span>
            {run.route ? (
              <span className="ml-auto text-xs text-muted-foreground">
                {run.route.distanceKm} km
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export type { RunCardData };
