import Link from "next/link";
import { Flag, ChevronLeft, ShieldCheck, ShieldAlert } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { initials, formatDate } from "@/lib/utils";
import { REPORT_REASONS } from "@/constants/config";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [reports, sanctions] = await Promise.all([
    prisma.report.findMany({
      where: { reporterId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        reported: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
      },
    }),
    prisma.sanction.findMany({
      where: { userId: session.user.id },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  return (
    <main className="px-4 pt-6 pb-10">
      <Link href="/profile" className="mb-2 inline-flex items-center text-sm text-brand-700">
        <ChevronLeft className="mr-1 h-4 w-4" /> Retour
      </Link>
      <h1 className="text-2xl font-bold text-brand-900">Mes signalements</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Historique des signalements que tu as effectués + sanctions reçues.
      </p>

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Signalements ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <EmptyState
            icon={<Flag className="h-6 w-6" />}
            title="Aucun signalement"
            description="Tu n'as signalé personne — tant mieux."
          />
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    {r.reported.photoUrl ? (
                      <AvatarImage src={r.reported.photoUrl} alt={r.reported.firstName} />
                    ) : null}
                    <AvatarFallback>
                      {initials(r.reported.firstName, r.reported.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {r.reported.firstName} {r.reported.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS]} ·{" "}
                      {formatDate(r.createdAt)}
                    </p>
                    {r.comment ? (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        « {r.comment} »
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={r.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sanctions reçues ({sanctions.length})
        </h2>
        {sanctions.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Aucune sanction"
            description="Tu es en règle avec la communauté."
          />
        ) : (
          <div className="space-y-2">
            {sanctions.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{sanctionLabel(s.type)}</p>
                    <p className="text-xs text-muted-foreground">{s.reason}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Du {formatDate(s.startsAt)}
                      {s.endsAt ? ` au ${formatDate(s.endsAt)}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "secondary" | "warning" | "success" | "destructive"; label: string }> = {
    PENDING: { variant: "warning", label: "En attente" },
    UNDER_REVIEW: { variant: "secondary", label: "En cours" },
    VALIDATED: { variant: "success", label: "Validé" },
    REJECTED: { variant: "destructive", label: "Rejeté" },
  };
  const m = map[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function sanctionLabel(type: string): string {
  const map: Record<string, string> = {
    WARNING: "Avertissement",
    SPONSOR_BLOCK_6M: "Parrainage bloqué 6 mois",
    PERMANENT_BAN: "Bannissement permanent",
    TEMPORARY_BAN: "Bannissement temporaire",
  };
  return map[type] || type;
}
