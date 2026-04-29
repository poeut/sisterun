"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runSchema, type RunInput } from "@/lib/validators";
import { PARIS_LANDMARKS } from "@/constants/paris";

function defaultDateTime(): string {
  // Demain 18h pile, format value pour <input type="datetime-local">
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(18, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export default function CreateRunPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [spotIdx, setSpotIdx] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RunInput>({
    resolver: zodResolver(runSchema),
    defaultValues: {
      title: "",
      description: "",
      startAddress: PARIS_LANDMARKS[0].name + ", Paris",
      startLat: PARIS_LANDMARKS[0].lat,
      startLng: PARIS_LANDMARKS[0].lng,
      scheduledAt: defaultDateTime(),
      durationMin: 45,
      level: "INTERMEDIATE",
      maxParticipants: 8,
    },
  });

  const onSpotChange = (i: number) => {
    setSpotIdx(i);
    const s = PARIS_LANDMARKS[i];
    setValue("startLat", s.lat, { shouldValidate: true });
    setValue("startLng", s.lng, { shouldValidate: true });
    setValue("startAddress", s.name + ", Paris", { shouldValidate: true });
  };

  const onSubmit = async (data: RunInput) => {
    setSubmitting(true);
    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        durationMin: Number(data.durationMin),
        maxParticipants: Number(data.maxParticipants),
        startLat: Number(data.startLat),
        startLng: Number(data.startLng),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Erreur lors de la création.");
      return;
    }
    const { run } = await res.json();
    toast.success("Course créée 🎉");
    router.push(`/runs/${run.id}`);
    router.refresh();
  };

  const watchedLat = watch("startLat");

  return (
    <main className="px-6 pt-6 pb-10">
      <Link href="/runs" className="mb-4 inline-flex items-center text-sm text-brand-700">
        <ChevronLeft className="mr-1 h-4 w-4" /> Retour
      </Link>
      <h1 className="text-2xl font-bold text-brand-900">Créer une course</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        En 3 clics : nom, lieu, horaire, niveau. Tu es ajoutée comme première participante.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            placeholder="Ex : Sortie matinale au parc Monceau"
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description (optionnel)</Label>
          <textarea
            id="description"
            rows={3}
            maxLength={500}
            {...register("description")}
            className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
            placeholder="Allure, distance, ambiance, code vestimentaire…"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Point de départ *</Label>
          <div className="grid grid-cols-2 gap-2">
            {PARIS_LANDMARKS.map((s, i) => (
              <button
                type="button"
                key={s.name}
                onClick={() => onSpotChange(i)}
                className={
                  "flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-colors " +
                  (spotIdx === i
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-border hover:bg-secondary")
                }
              >
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Coordonnées sélectionnées : {Number(watchedLat).toFixed(4)},{" "}
            {Number(watch("startLng")).toFixed(4)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt">Date & heure *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              {...register("scheduledAt")}
            />
            {errors.scheduledAt ? (
              <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="durationMin">Durée (min)</Label>
            <Input
              id="durationMin"
              type="number"
              min={15}
              max={180}
              step={5}
              {...register("durationMin", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="level">Niveau *</Label>
            <select
              id="level"
              {...register("level")}
              className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base"
            >
              <option value="BEGINNER">Débutante</option>
              <option value="INTERMEDIATE">Intermédiaire</option>
              <option value="ADVANCED">Confirmée</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxParticipants">Max participantes *</Label>
            <Input
              id="maxParticipants"
              type="number"
              min={2}
              max={20}
              {...register("maxParticipants", { valueAsNumber: true })}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publier la course"}
        </Button>
      </form>
    </main>
  );
}
