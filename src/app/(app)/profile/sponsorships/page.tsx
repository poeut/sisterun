import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { VerifiedBadge, LevelBadge } from "@/components/profile/VerifiedBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { initials, formatDate } from "@/lib/utils";

export default async function SponsorshipsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [given, received] = await Promise.all([
    prisma.sponsorship.findMany({
      where: { sponsorId: session.user.id },
      include: { sponsored: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sponsorship.findMany({
      where: { sponsoredId: session.user.id },
      include: { sponsor: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="px-6 pt-6 pb-10">
      <Link href="/profile" className="mb-4 inline-flex items-center text-sm text-brand-700">
        <ChevronLeft className="mr-1 h-4 w-4" /> Retour
      </Link>

      <h1 className="text-2xl font-bold text-brand-900">Mes parrainages</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Le parrainage renforce la confiance dans la communauté. Si une de tes
        filleules est signalée, tu es bloquée 6 mois.
      </p>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Mes filleules ({given.length})
        </h2>
        {given.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Aucune filleule"
            description="Tu n'as parrainé personne pour l'instant."
          />
        ) : (
          <div className="space-y-2">
            {given.map((s) => (
              <UserRow
                key={s.id}
                user={s.sponsored}
                subtitle={`Parrainée le ${formatDate(s.createdAt)}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Mes parraines ({received.length})
        </h2>
        {received.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Aucune marraine"
            description="Tu n'as pas (encore) été parrainée par une membre."
          />
        ) : (
          <div className="space-y-2">
            {received.map((s) => (
              <UserRow
                key={s.id}
                user={s.sponsor}
                subtitle={`Marraine depuis le ${formatDate(s.createdAt)}`}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function UserRow({
  user,
  subtitle,
}: {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    verified: boolean;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  };
  subtitle: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3.5">
        <Avatar className="h-12 w-12">
          {user.photoUrl ? (
            <AvatarImage src={user.photoUrl} alt={user.firstName} />
          ) : null}
          <AvatarFallback>{initials(user.firstName, user.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {user.verified ? <VerifiedBadge /> : null}
            <LevelBadge level={user.level} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
