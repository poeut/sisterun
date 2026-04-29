import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.verified) redirect("/kyc");
  // Phase 4 ajoutera la BottomNav et la TopBar
  return <div className="min-h-screen pb-24">{children}</div>;
}
