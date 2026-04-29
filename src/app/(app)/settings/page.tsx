"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronLeft, Download, Trash2, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const exportData = () => {
    // L'API renvoie directement un blob JSON
    window.location.href = "/api/users/me/export";
    toast.success("Export téléchargé.");
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const res = await fetch("/api/users/me/delete", { method: "POST" });
    setDeleting(false);
    if (!res.ok) {
      toast.error("Suppression impossible.");
      return;
    }
    toast.success("Compte supprimé.");
    await signOut({ callbackUrl: "/" });
    router.refresh();
  };

  return (
    <main className="px-4 pt-6 pb-10">
      <Link href="/profile" className="mb-2 inline-flex items-center text-sm text-brand-700">
        <ChevronLeft className="mr-1 h-4 w-4" /> Retour
      </Link>
      <h1 className="text-2xl font-bold text-brand-900">Paramètres</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestion de tes données personnelles (RGPD).
      </p>

      <section className="mt-6 space-y-3">
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Download className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Exporter mes données</p>
              <p className="text-xs text-muted-foreground">
                Télécharge un JSON avec toutes les données associées à ton
                compte (profil, courses, signalements, contacts).
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={exportData}>
              Exporter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Shield className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Charte communautaire</p>
              <p className="text-xs text-muted-foreground">
                Tolérance zéro pour le harcèlement. Trois signalements validés
                = bannissement permanent. Le parrainage engage : un filleul
                signalé = 6 mois de blocage du parrain.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-destructive">
                Supprimer mon compte
              </p>
              <p className="text-xs text-muted-foreground">
                Suppression définitive de toutes tes données.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              Supprimer
            </Button>
          </CardContent>
        </Card>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Supprimer définitivement ton compte ?
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes tes données personnelles
              seront effacées (profil, contacts d&apos;urgence, signalements).
              Tes courses passées seront anonymisées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
