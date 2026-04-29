"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function JoinButton({
  runId,
  isParticipant,
  isOrganizer,
  isFull,
  isFinished,
}: {
  runId: string;
  isParticipant: boolean;
  isOrganizer: boolean;
  isFull: boolean;
  isFinished: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isOrganizer) {
    return (
      <Button variant="outline" disabled className="w-full">
        Tu es l&apos;organisatrice
      </Button>
    );
  }

  if (isFinished) {
    return (
      <Button variant="outline" disabled className="w-full">
        Course terminée
      </Button>
    );
  }

  const action = async (kind: "join" | "leave") => {
    setLoading(true);
    const res = await fetch(`/api/runs/${runId}/${kind}`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Action impossible.");
      return;
    }
    toast.success(kind === "join" ? "Tu as rejoint la course !" : "Tu t'es désinscrite.");
    router.refresh();
  };

  if (isParticipant) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => action("leave")}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Se désinscrire"}
      </Button>
    );
  }

  return (
    <Button
      className="w-full"
      onClick={() => action("join")}
      disabled={loading || isFull}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isFull ? (
        "Course complète"
      ) : (
        "Rejoindre la course"
      )}
    </Button>
  );
}
