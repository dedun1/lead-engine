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
  open: 'bg-green-500',
  soon: 'bg-yellow-500',
  closed: 'bg-gray-400',
  unknown: 'bg-gray-300',
};
