// Placeholder Phase 4 — vraie modération en Phase 7
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPlaceholder() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    redirect("/map");
  }
  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl font-bold text-brand-900">Modération</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Le mini back-office de modération arrive en Phase 7.
      </p>
    </main>
  );
}
