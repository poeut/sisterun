"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Me = {
  firstName: string;
  lastName: string;
  bio: string | null;
  phone: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
};

export default function EditProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => toast.error("Impossible de charger le profil."));
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!me) return;
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(me),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Erreur lors de la sauvegarde.");
      return;
    }
    toast.success("Profil mis à jour.");
    router.push("/profile");
    router.refresh();
  };

  if (!me) {
    return (
      <main className="px-6 py-8">
        <div className="h-40 animate-pulse rounded-2xl bg-brand-50" />
      </main>
    );
  }

  return (
    <main className="px-6 pt-6 pb-10">
      <Link href="/profile" className="mb-4 inline-flex items-center text-sm text-brand-700">
        <ChevronLeft className="mr-1 h-4 w-4" /> Retour
      </Link>
      <h1 className="text-2xl font-bold text-brand-900">Modifier mon profil</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={me.firstName}
              onChange={(e) => setMe({ ...me, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={me.lastName}
              onChange={(e) => setMe({ ...me, lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={me.phone ?? ""}
            onChange={(e) => setMe({ ...me, phone: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            rows={4}
            maxLength={300}
            value={me.bio ?? ""}
            onChange={(e) => setMe({ ...me, bio: e.target.value })}
            className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
            placeholder="Quelques mots sur toi, ton allure préférée…"
          />
          <p className="text-xs text-muted-foreground">{(me.bio ?? "").length}/300</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="level">Niveau de course</Label>
          <select
            id="level"
            value={me.level}
            onChange={(e) =>
              setMe({ ...me, level: e.target.value as Me["level"] })
            }
            className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base"
          >
            <option value="BEGINNER">Débutante (≤ 5 km)</option>
            <option value="INTERMEDIATE">Intermédiaire (5-10 km)</option>
            <option value="ADVANCED">Confirmée (≥ 10 km)</option>
          </select>
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enregistrer"}
        </Button>
      </form>
    </main>
  );
}
