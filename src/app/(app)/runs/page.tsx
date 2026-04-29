"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Activity, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RunCard, type RunCardData } from "@/components/runs/RunCard";
import { EmptyState } from "@/components/common/EmptyState";

type Tab = "upcoming" | "active" | "mine";

export default function RunsListPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [runs, setRuns] = useState<RunCardData[] | null>(null);

  useEffect(() => {
    setRuns(null);
    const params = new URLSearchParams();
    if (tab === "upcoming") params.set("status", "SCHEDULED");
    if (tab === "active") params.set("status", "ACTIVE");
    if (tab === "mine") params.set("mine", "1");
    fetch(`/api/runs?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setRuns(d.runs))
      .catch(() => setRuns([]));
  }, [tab]);

  return (
    <main className="px-4 pt-4 pb-10">
      <header className="mb-4 px-2">
        <h1 className="text-2xl font-bold text-brand-900">Courses</h1>
        <p className="text-sm text-muted-foreground">
          Trouve ta prochaine sortie ou organise la tienne.
        </p>
      </header>

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-secondary p-1 text-xs font-semibold">
        <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")} icon={<Calendar className="h-3.5 w-3.5" />} label="À venir" />
        <TabButton active={tab === "active"} onClick={() => setTab("active")} icon={<Activity className="h-3.5 w-3.5" />} label="En cours" />
        <TabButton active={tab === "mine"} onClick={() => setTab("mine")} icon={<User className="h-3.5 w-3.5" />} label="Mes courses" />
      </div>

      <Button asChild className="mb-4 w-full">
        <Link href="/runs/create">
          <Plus className="mr-2 h-5 w-5" /> Créer une course
        </Link>
      </Button>

      {runs === null ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-brand-50" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-6 w-6" />}
          title="Aucune course ici pour l'instant"
          description={
            tab === "mine"
              ? "Tu n'es inscrite à aucune course. Rejoins-en une depuis l'onglet À venir."
              : "Sois la première à organiser quelque chose !"
          }
          action={
            <Button asChild>
              <Link href="/runs/create">Créer une course</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {runs.map((r) => (
            <RunCard key={r.id} run={r} />
          ))}
        </div>
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 transition-colors " +
        (active
          ? "bg-card text-brand-700 shadow-sm"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {icon}
      {label}
    </button>
  );
}
