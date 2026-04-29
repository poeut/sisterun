"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck, ShieldX, Loader2, Flag } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { initials, formatDateTime } from "@/lib/utils";
import { REPORT_REASONS } from "@/constants/config";

type AdminReport = {
  id: string;
  reason: string;
  comment: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; firstName: string; lastName: string; photoUrl: string | null };
  reported: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    verified: boolean;
    banned: boolean;
  };
};

type AdminData = {
  pending: AdminReport[];
  counters: { pending: number; validated: number; rejected: number; usersBanned: number };
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (
      status === "authenticated" &&
      session?.user?.role !== "ADMIN" &&
      session?.user?.role !== "MODERATOR"
    ) {
      router.replace("/map");
      return;
    }
    if (status === "authenticated") {
      reload();
    }
  }, [status, session, router]);

  const reload = () =>
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Erreur de chargement."));

  const resolve = async (id: string, decision: "VALIDATED" | "REJECTED") => {
    setResolving(id);
    const res = await fetch(`/api/admin/reports/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setResolving(null);
    if (!res.ok) {
      toast.error("Action impossible.");
      return;
    }
    const body = await res.json();
    if (decision === "VALIDATED" && body.summary) {
      const s = body.summary as { reportedAction: string; sponsorAction?: string };
      toast.success(
        `Validé. Sanction signalée : ${s.reportedAction}${
          s.sponsorAction && s.sponsorAction !== "NONE"
            ? ` · Parrain : ${s.sponsorAction}`
            : ""
        }`
      );
    } else {
      toast.success("Rapport rejeté.");
    }
    reload();
  };

  if (!data) {
    return (
      <main className="px-4 py-6">
        <div className="h-32 animate-pulse rounded-2xl bg-brand-50" />
      </main>
    );
  }

  return (
    <main className="px-4 py-6 pb-32">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-900">
          <ShieldAlert className="h-6 w-6 text-amber-600" /> Modération
        </h1>
        <p className="text-sm text-muted-foreground">
          File des signalements en attente.
        </p>
      </header>

      <section className="mb-4 grid grid-cols-4 gap-2 text-center">
        <Counter label="À traiter" value={data.counters.pending} accent />
        <Counter label="Validés" value={data.counters.validated} />
        <Counter label="Rejetés" value={data.counters.rejected} />
        <Counter label="Bannies" value={data.counters.usersBanned} />
      </section>

      {data.pending.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="File vide"
          description="Aucun signalement en attente. Bravo la communauté !"
        />
      ) : (
        <div className="space-y-3">
          {data.pending.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="warning">
                    {REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(r.createdAt)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <UserMini label="Rapporteuse" user={r.reporter} />
                  <UserMini
                    label="Signalée"
                    user={r.reported}
                    extra={r.reported.banned ? <Badge variant="destructive">Bannie</Badge> : null}
                  />
                </div>

                {r.comment ? (
                  <p className="rounded-xl bg-secondary p-3 text-xs italic">
                    « {r.comment} »
                  </p>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1"
                    variant="destructive"
                    disabled={resolving === r.id}
                    onClick={() => resolve(r.id, "VALIDATED")}
                  >
                    {resolving === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Flag className="mr-1 h-4 w-4" /> Valider
                      </>
                    )}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={resolving === r.id}
                    onClick={() => resolve(r.id, "REJECTED")}
                  >
                    <ShieldX className="mr-1 h-4 w-4" /> Rejeter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function Counter({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border p-3 " +
        (accent ? "border-amber-200 bg-amber-50" : "border-border bg-card")
      }
    >
      <div className={"text-xl font-bold " + (accent ? "text-amber-700" : "text-foreground")}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function UserMini({
  label,
  user,
  extra,
}: {
  label: string;
  user: { firstName: string; lastName: string; photoUrl: string | null };
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Avatar className="h-7 w-7">
          {user.photoUrl ? (
            <AvatarImage src={user.photoUrl} alt={user.firstName} />
          ) : null}
          <AvatarFallback className="text-[9px]">
            {initials(user.firstName, user.lastName)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate font-medium">
          {user.firstName} {user.lastName}
        </span>
      </div>
      {extra ? <div className="mt-1">{extra}</div> : null}
    </div>
  );
}
