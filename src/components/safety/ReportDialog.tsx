"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { REPORT_REASONS } from "@/constants/config";

type Reason = keyof typeof REPORT_REASONS;

export function ReportDialog({
  reportedId,
  reportedName,
  trigger,
}: {
  reportedId: string;
  reportedName: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("HARASSMENT");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedId, reason, comment }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Erreur signalement.");
      return;
    }
    toast.success("Signalement transmis à la modération.");
    setComment("");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
      >
        {trigger ?? (
          <>
            <Flag className="h-3.5 w-3.5" /> Signaler
          </>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler {reportedName}</DialogTitle>
            <DialogDescription>
              Ton signalement est transmis à la modération sous 1 s. Si validé,
              {" "}des sanctions automatiques s&apos;appliquent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reason">Motif</Label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as Reason)}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base"
              >
                {(Object.keys(REPORT_REASONS) as Reason[]).map((k) => (
                  <option key={k} value={k}>
                    {REPORT_REASONS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment">Commentaire (optionnel)</Label>
              <textarea
                id="comment"
                rows={4}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                placeholder="Décris le contexte (lieu, heure, comportement)…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={submit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Envoyer le signalement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
