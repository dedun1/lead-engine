/** Theme-aware Tailwind class strings (work in light, dark, and sepia). */

export const EMAIL_STATUS_CLASS: Record<string, string> = {
  verified: 'bg-chart-3/15 text-chart-3',
  risky: 'bg-warning/15 text-warning',
  invalid: 'bg-destructive/15 text-destructive',
  unverified: 'bg-muted text-muted-foreground',
};

export const LEAD_STATUS_BADGE_CLASS: Record<string, string> = {
  new: 'bg-primary/10 text-primary border border-primary/25',
  queued: 'bg-chart-1/15 text-chart-1',
  contacted: 'bg-chart-5/15 text-chart-5',
  meeting_set: 'bg-chart-3/15 text-chart-3',
  customer: 'bg-chart-2/15 text-chart-2',
  dead: 'bg-muted text-muted-foreground',
  dnc: 'bg-destructive/15 text-destructive',
};

/** Small status dots (e.g. call queue rail). */
export const LEAD_STATUS_DOT_CLASS: Record<string, string> = {
  new: 'bg-primary',
  queued: 'bg-chart-1',
  contacted: 'bg-chart-5',
  meeting_set: 'bg-chart-3',
  customer: 'bg-chart-2',
  dead: 'bg-muted-foreground',
  dnc: 'bg-destructive',
};

export const TRIGGER_SEVERITY_CLASS: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-secondary text-secondary-foreground',
  high: 'bg-accent text-accent-foreground border border-chart-4/40',
  critical: 'bg-destructive/20 text-destructive font-semibold',
};

export const HEALTH_STATUS_CLASS: Record<string, string> = {
  healthy: 'bg-chart-3/15 text-chart-3',
  degraded: 'bg-warning/15 text-warning',
  down: 'bg-destructive/15 text-destructive',
  disabled: 'bg-muted text-muted-foreground',
};

export const NICHE_STATUS_ICON: Record<string, string> = {
  worth: 'text-chart-3',
  inconclusive: 'text-warning',
  skip: 'text-destructive',
};

/** Modal overlay scrim — darkens using foreground hue at 80% opacity. */
export const OVERLAY_SCRIM = 'bg-foreground/80';
