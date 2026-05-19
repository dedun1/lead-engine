import {
  closesInSeconds,
  isOpenNow,
  type WeeklyHours,
} from '@/lib/hours';

export type HoursDot = 'open' | 'soon' | 'closed' | 'unknown';

export function getHoursDot(
  hours: WeeklyHours | null | undefined,
  timezone: string | null | undefined,
): HoursDot {
  if (!hours || !timezone) return 'unknown';
  if (!isOpenNow(hours, timezone)) return 'closed';
  const closes = closesInSeconds(hours, timezone);
  if (closes != null && closes <= 7200) return 'soon';
  return 'open';
}

export const HOURS_DOT_CLASS: Record<HoursDot, string> = {
  open: 'bg-chart-3',
  soon: 'bg-warning',
  closed: 'bg-muted-foreground/50',
  unknown: 'bg-border',
};
