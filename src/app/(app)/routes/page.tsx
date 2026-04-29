"use client";

import { useEffect, useState } from "react";
import { Sparkles, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MapViewClient from "@/components/map/MapView.client";

type ScoredRoute = {
  id: string;
  name: string;
  description: string;
  distanceKm: number;
  safetyScore: number;
  dynamicScore: number;
  bestTimeOfDay: string;
  lighting: number;
  popularity: number;
  geoJson: { type: string; coordinates: [number, number][] };
};

export default function RoutesPage() {
  const [hour, setHour] = useState(new Date().getHours());
  const [routes, setRoutes] = useState<ScoredRoute[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/routes?hour=${hour}`)
      .then((r) => r.json())
      .then((d) => {
        setRoutes(d.routes);
        if (d.routes?.length && !selected) setSelected(d.routes[0].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour]);

  const selectedRoute = routes?.find((r) => r.id === selected);
  const polylines = selectedRoute
    ? [
        {
          id: selectedRoute.id,
          positions: selectedRoute.geoJson.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number]
          ),
          color: "#7B2D8E",
        },
      ]
    : [];

  return (
    <main className="pb-10">
      <header className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-brand-900">Parcours suggérés</h1>
        <p className="text-sm text-muted-foreground">
          Scorés sur l&apos;éclairage, la fréquentation, l&apos;adéquation horaire.
        </p>
      </header>

      {/* Picker horaire */}
      <section className="mt-4 px-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quand veux-tu courir ?
        </p>
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-secondary p-1">
          <PeriodBtn active={hour >= 6 && hour < 12} onClick={() => setHour(8)} icon={<Sunrise className="h-4 w-4" />} label="Matin" />
          <PeriodBtn active={hour >= 12 && hour < 18} onClick={() => setHour(15)} icon={<Sun className="h-4 w-4" />} label="A.midi" />
          <PeriodBtn active={hour >= 18 && hour < 22} onClick={() => setHour(20)} icon={<Sunset className="h-4 w-4" />} label="Soir" />
          <PeriodBtn active={hour >= 22 || hour < 6} onClick={() => setHour(23)} icon={<Moon className="h-4 w-4" />} label="Nuit" />
        </div>
      </section>

      {/* Carte */}
      <section className="mt-4 h-56 w-full">
        <MapViewClient
          markers={
            selectedRoute
              ? [
                  {
                    id: "start",
                    lat: selectedRoute.geoJson.coordinates[0][1],
                    lng: selectedRoute.geoJson.coordinates[0][0],
                  },
                ]
              : []
          }
          polylines={polylines}
        />
      </section>

      {/* Liste */}
      <section className="space-y-2 px-4 pt-4">
        {routes === null ? (
          <div className="space-y-2">
            <div className="h-24 animate-pulse rounded-2xl bg-brand-50" />
            <div className="h-24 animate-pulse rounded-2xl bg-brand-50" />
          </div>
        ) : (
          routes.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className="block w-full text-left"
            >
              <Card
                className={
                  selected === r.id
                    ? "border-brand-500 ring-2 ring-brand-200"
                    : ""
                }
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <ScoreRing value={r.dynamicScore} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-tight">{r.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {r.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{r.distanceKm} km</Badge>
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3" /> Lum. {r.lighting}/5
                      </Badge>
                      <Badge variant="outline">Pop. {r.popularity}/5</Badge>
                      <Badge variant="outline">
                        Idéal : {periodLabel(r.bestTimeOfDay)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))
        )}
      </section>
    </main>
  );
}

function PeriodBtn({
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
        "flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors " +
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

function periodLabel(p: string) {
  return (
    {
      morning: "matin",
      afternoon: "après-midi",
      evening: "soir",
      night: "nuit",
    } as Record<string, string>
  )[p] ?? p;
}

function ScoreRing({ value }: { value: number }) {
  const color =
    value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{
        background: `conic-gradient(${color} ${value * 3.6}deg, #e5e7eb 0)`,
      }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground">
        {value}
      </span>
    </div>
  );
}
