import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.verified) redirect("/kyc");
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
  return (
    <div className="relative min-h-screen pb-24">
      {children}
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
