"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Users, Route as RouteIcon, User, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

const ITEMS: Item[] = [
  { href: "/map", label: "Carte", icon: Map, match: (p) => p.startsWith("/map") },
  { href: "/runs", label: "Courses", icon: Users, match: (p) => p.startsWith("/runs") },
  { href: "/routes", label: "Parcours", icon: RouteIcon, match: (p) => p.startsWith("/routes") },
  { href: "/profile", label: "Profil", icon: User, match: (p) => p.startsWith("/profile") || p.startsWith("/settings") },
];

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      aria-label="Navigation principale"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active
                    ? "text-brand-700"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-6 w-6", active ? "text-brand-600" : "")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {isAdmin ? (
        <Link
          href="/admin"
          className="flex w-full items-center justify-center gap-1 border-t border-border bg-amber-50 py-1.5 text-[11px] font-semibold text-amber-700"
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Modération
        </Link>
      ) : null}
    </nav>
  );
}
