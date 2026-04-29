import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {icon}
        </div>
      ) : null}
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="mb-4 max-w-xs text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}
