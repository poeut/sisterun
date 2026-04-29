// Placeholder Phase 3 — la vraie carte arrive en Phase 5.
import { auth } from "@/lib/auth";

export default async function MapPage() {
  const session = await auth();
  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl font-bold text-brand-900">
        Bonjour {session?.user?.name?.split(" ")[0] ?? ""} 👋
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        La carte des courses arrive en Phase 5. Tu es bien authentifiée et
        vérifiée.
      </p>
    </main>
  );
}
