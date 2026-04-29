import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export function TopBar({
  title,
  subtitle,
  user,
}: {
  title: string;
  subtitle?: string;
  user: { firstName: string; lastName: string; photoUrl: string | null };
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-brand-900">{title}</h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <Link href="/profile" className="shrink-0">
        <Avatar className="h-10 w-10">
          {user.photoUrl ? (
            <AvatarImage src={user.photoUrl} alt={user.firstName} />
          ) : null}
          <AvatarFallback>{initials(user.firstName, user.lastName)}</AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
