"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SOSButton({ runId }: { runId: string }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const trigger = async () => {
    setSending(true);
    let lat = 48.8566;
    let lng = 2.3522;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 4000,
          maximumAge: 30_000,
        })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // Pas de géoloc : on envoie quand même le SOS avec point Paris par défaut
      console.warn("Géoloc indisponible, SOS envoyé avec position par défaut.");
    }

    const res = await fetch(`/api/runs/${runId}/sos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
    setSending(false);
    setOpen(false);
    if (!res.ok) {
      toast.error("Impossible d'envoyer l'alerte. Réessaie.");
      return;
    }
    toast.success("🚨 Alerte SOS envoyée. Le groupe est prévenu.", {
      duration: 8000,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-4 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-white shadow-xl shadow-destructive/40 transition active:scale-95"
        aria-label="Bouton SOS — alerte d'urgence"
      >
        <span className="absolute inset-0 animate-pulseRing rounded-full bg-destructive/40" />
        <span className="relative flex flex-col items-center justify-center text-[10px] font-bold tracking-wider">
          <AlertTriangle className="mb-0.5 h-5 w-5" />
          SOS
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Déclencher une alerte SOS
            </DialogTitle>
            <DialogDescription>
              Toutes les participantes vont recevoir une notification avec ta
              position. Tes contacts d&apos;urgence sont prévenus par email.
              <br />À utiliser uniquement en cas de danger réel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={trigger} disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmer l&apos;alerte SOS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
