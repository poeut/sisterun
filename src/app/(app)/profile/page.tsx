import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Pencil,
  Phone,
  Users as UsersIcon,
  Settings,
  Shield,
  ShieldOff,
  CalendarRange,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  VerifiedBadge,
  PremiumBadge,
  AdminBadge,
  LevelBadge,
} from "@/components/profile/VerifiedBadge";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { initials, formatDate } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          organizedRuns: true,
          participations: true,
          emergencyContacts: true,
          sponsorshipsGiven: true,
        },
      },
    },
  });
  if (!user) redirect("/login");

  const sponsorBlocked =
    !!user.sponsorBlockedUntil && user.sponsorBlockedUntil > new Date();

  return (
    <main className="pb-10">
      {/* Header avec gradient */}
      <section className="bg-gradient-to-br from-brand-500 to-accent px-6 pt-10 pb-16 text-white">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-white/40">
            {user.photoUrl ? (
              <AvatarImage src={user.photoUrl} alt={user.firstName} />
            ) : null}
            <AvatarFallback className="bg-white text-brand-700">
              {initials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="truncate text-sm text-white/80">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.verified ? <VerifiedBadge /> : null}
          {user.premium ? <PremiumBadge /> : null}
          {user.role !== "USER" ? <AdminBadge /> : null}
          <LevelBadge level={user.level} />
        </div>
      </section>

      {/* Carte stats — overlap visuel sur le gradient */}
      <section className="-mt-10 px-4">
        <Card>
          <CardContent className="grid grid-cols-3 divide-x divide-border p-0">
            <Stat
              value={user._count.organizedRuns}
              label="Organisées"
            />
            <Stat
              value={user._count.participations}
              label="Participations"
            />
            <Stat
              value={user._count.sponsorshipsGiven}
              label="Filleules"
            />
          </CardContent>
        </Card>
      </section>

      {/* Bio */}
      {user.bio ? (
        <section className="px-6 pt-6">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            À propos
          </h2>
          <p className="text-sm">{user.bio}</p>
        </section>
      ) : null}

      {/* Bandeau parrainage bloqué */}
      {sponsorBlocked ? (
        <section className="px-4 pt-6">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">
                  Parrainage suspendu
                </p>
                <p className="text-sm text-amber-800">
                  Ton droit de parrainer est bloqué jusqu&apos;au{" "}
                  {formatDate(user.sponsorBlockedUntil!)}, suite à un signalement
                  validé contre une de tes filleules.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Actions */}
      <section className="space-y-2 px-4 pt-6">
        <RowLink href="/profile/edit" icon={<Pencil className="h-5 w-5" />} label="Modifier mon profil" />
        <RowLink
          href="/profile/emergency"
          icon={<Phone className="h-5 w-5" />}
          label="Contacts d'urgence"
          right={<span className="text-xs text-muted-foreground">{user._count.emergencyContacts}</span>}
        />
        <RowLink
          href="/profile/sponsorships"
          icon={<UsersIcon className="h-5 w-5" />}
          label="Mes parrainages"
        />
        <RowLink href="/settings" icon={<Settings className="h-5 w-5" />} label="Paramètres / RGPD" />
        <RowLink href="/reports" icon={<Shield className="h-5 w-5" />} label="Mes signalements" />
      </section>

      {/* Inscription */}
      <section className="px-6 pt-6 text-center text-xs text-muted-foreground">
        <CalendarRange className="mx-auto mb-1 h-4 w-4" />
        Membre depuis le {formatDate(user.createdAt)}
      </section>

      <section className="px-4 pt-6">
        <LogoutButton />
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-4">
      <div className="text-xl font-bold text-brand-700">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function RowLink({
  href,
  icon,
  label,
  right,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-medium transition-colors hover:bg-secondary"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {right ?? <span className="text-muted-foreground">›</span>}
    </Link>
  );
}
