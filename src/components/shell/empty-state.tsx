import type { ReactNode } from 'react';

// Shared empty-state shell used by every Phase 1 page. Each scaffolded page
// passes its own title / description / optional CTA so the user is never left
// staring at a blank screen.
export function EmptyState({
  title,
  description,
  action,
  phaseLabel,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  phaseLabel?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="max-w-md space-y-3 text-center">
        {phaseLabel && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {phaseLabel}
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
