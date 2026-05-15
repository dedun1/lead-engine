import { DateTime } from 'luxon';

export type DayHours = { open: string; close: string }[];
export type WeeklyHours = Record<string, DayHours | 'closed' | '24_7'>;

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

/** Best-effort parse of Google Maps hours text into weekly structure. */
export function parseGoogleMapsHours(rawText: string): WeeklyHours {
  const lower = rawText.toLowerCase();
  if (lower.includes('24 hours') || lower.includes('open 24')) {
    return Object.fromEntries(DAY_KEYS.map((d) => [d, '24_7']));
  }

  const hours: WeeklyHours = {};
  for (const day of DAY_KEYS) {
    hours[day] = 'closed';
  }

  const parts = rawText.split(/[,;]+/).map((p) => p.trim());
  for (const part of parts) {
    const match = part.match(
      /(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    );
    if (!match) continue;
    const key = dayKeyFromToken(match[1]);
    if (!key) continue;
    hours[key] = [
      {
        open: normalizeTime(match[2]),
        close: normalizeTime(match[3]),
      },
    ];
  }
  return hours;
}

function dayKeyFromToken(token: string): string | null {
  const map: Record<string, string> = {
    mon: 'monday',
    tue: 'tuesday',
    wed: 'wednesday',
    thu: 'thursday',
    fri: 'friday',
    sat: 'saturday',
    sun: 'sunday',
  };
  return map[token.toLowerCase().slice(0, 3)] ?? null;
}

function normalizeTime(raw: string): string {
  const t = raw.trim().toUpperCase();
  const dt = DateTime.fromFormat(t, 'h:mm a');
  if (dt.isValid) return dt.toFormat('HH:mm');
  const dt2 = DateTime.fromFormat(t, 'ha');
  if (dt2.isValid) return dt2.toFormat('HH:mm');
  return '09:00';
}

export function isOpenNow(hours: WeeklyHours, timezone: string): boolean {
  const now = DateTime.now().setZone(timezone);
  const key = DAY_KEYS[now.weekday - 1];
  const day = hours[key];
  if (day === '24_7') return true;
  if (day === 'closed' || !day?.length) return false;
  const current = now.toFormat('HH:mm');
  return day.some((r) => r.open <= current && current <= r.close);
}

export function closesInSeconds(
  hours: WeeklyHours,
  timezone: string,
): number | null {
  if (!isOpenNow(hours, timezone)) return null;
  const now = DateTime.now().setZone(timezone);
  const key = DAY_KEYS[now.weekday - 1];
  const day = hours[key];
  if (day === '24_7' || day === 'closed' || !day?.length) return null;
  const current = now.toFormat('HH:mm');
  const slot = day.find((r) => r.open <= current && current <= r.close);
  if (!slot) return null;
  const close = DateTime.fromFormat(slot.close, 'HH:mm', { zone: timezone });
  const end = now.set({
    hour: close.hour,
    minute: close.minute,
    second: 0,
  });
  return Math.max(0, Math.floor(end.diff(now, 'seconds').seconds));
}
