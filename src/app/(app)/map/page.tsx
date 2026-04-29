import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapViewClient from "@/components/map/MapView.client";
import { TopBar } from "@/components/layout/TopBar";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, photoUrl: true },
  });
  if (!me) redirect("/login");

  const runs = await prisma.run.findMany({
    where: { status: { in: ["SCHEDULED", "ACTIVE"] } },
    orderBy: { scheduledAt: "asc" },
    include: {
      organizer: { select: { firstName: true } },
      _count: { select: { participations: true } },
    },
  });

  const markers = runs.map((r) => ({
    id: r.id,
    lat: r.startLat,
    lng: r.startLng,
    active: r.status === "ACTIVE",
    popup: (
      <div className="min-w-[180px] space-y-1.5">
        <div className="text-xs font-semibold">{r.title}</div>
        <div className="text-[11px] text-muted-foreground">
          {formatDateTime(r.scheduledAt)}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {r._count.participations}/{r.maxParticipants} participantes — par {r.organizer.firstName}
        </div>
        <Link
          href={`/runs/${r.id}`}
          className="mt-1 inline-block rounded-md bg-brand-500 px-2 py-1 text-[11px] font-semibold text-white"
        >
          Voir la course
        </Link>
      </div>
    ),
  }));

  return (
    <main className="flex h-screen flex-col">
      <TopBar
        title="Courses sur Paris"
        subtitle={`${runs.length} en cours ou à venir`}
        user={me}
      />

      <div className="relative flex-1">
        <MapViewClient markers={markers} />

        {/* Légende */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 rounded-xl bg-card/95 px-3 py-2 text-[11px] shadow-md backdrop-blur">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-accent" />
            En cours
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-brand-500" />
            À venir
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/runs/create"
          className="absolute bottom-28 right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition hover:bg-accent-600"
          aria-label="Créer une course"
        >
          <Plus className="h-6 w-6" />
        </Link>

        {runs.length === 0 ? (
          <div className="pointer-events-auto absolute bottom-28 left-1/2 max-w-[320px] -translate-x-1/2 rounded-2xl bg-card p-4 text-center text-sm shadow-md">
            <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-brand-600" />
            Aucune course pour l&apos;instant.{" "}
            <Link href="/runs/create" className="font-semibold text-brand-700">
              Crée la première&nbsp;!
            </Link>
          </div>
        ) : null}
      </div>

      <Button asChild className="mx-4 my-2" variant="outline">
        <Link href="/runs">Voir la liste détaillée</Link>
      </Button>
    </main>
  );
}
