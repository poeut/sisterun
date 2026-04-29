"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CheckInCamera({
  runId,
  onDone,
}: {
  runId: string;
  onDone: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamErr, setStreamErr] = useState<string | null>(null);
  const [snap, setSnap] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.error(e);
        setStreamErr(
          "Caméra inaccessible. Autorise l'accès à la caméra dans le navigateur."
        );
      }
    }
    start();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSnap(canvas.toDataURL("image/jpeg", 0.8));
  };

  const submit = async () => {
    if (!snap) return;
    setSubmitting(true);
    const blob = await (await fetch(snap)).blob();
    const fd = new FormData();
    fd.append("photo", new File([blob], "checkin.jpg", { type: "image/jpeg" }));
    const res = await fetch(`/api/runs/${runId}/checkin`, {
      method: "POST",
      body: fd,
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Check-in refusé.");
      return;
    }
    toast.success("Check-in validé 💪");
    onDone();
  };

  if (streamErr) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {streamErr}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        {snap ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={snap} alt="Selfie check-in" className="h-64 w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-64 w-full object-cover"
          />
        )}
      </div>
      {snap ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setSnap(null)}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reprendre
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Valider
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button onClick={capture} className="w-full">
          <Camera className="mr-2 h-5 w-5" /> Prendre la photo
        </Button>
      )}
    </div>
  );
}
