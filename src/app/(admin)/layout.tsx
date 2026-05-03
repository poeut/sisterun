import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    redirect("/map");
  }
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs">
        <Link
          href="/map"
          className="inline-flex items-center gap-1 font-semibold text-amber-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Quitter la modération
        </Link>
      </div>
      {children}
    </div>
  );
}
