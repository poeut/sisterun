import { ShieldCheck, Sparkles, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function VerifiedBadge() {
  return (
    <Badge variant="success" className="gap-1">
      <ShieldCheck className="h-3 w-3" /> Vérifiée
    </Badge>
  );
}

export function PremiumBadge() {
  return (
    <Badge variant="accent" className="gap-1">
      <Sparkles className="h-3 w-3" /> Premium
    </Badge>
  );
}

export function AdminBadge() {
  return (
    <Badge variant="warning" className="gap-1">
      <ShieldAlert className="h-3 w-3" /> Modération
    </Badge>
  );
}

export function LevelBadge({ level }: { level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" }) {
  const map = {
    BEGINNER: "Débutante",
    INTERMEDIATE: "Intermédiaire",
    ADVANCED: "Confirmée",
  } as const;
  return (
    <Badge variant="secondary">
      {map[level]}
    </Badge>
  );
}
