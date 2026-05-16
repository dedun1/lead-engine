import { DateTime } from 'luxon';
import type { DateRange, DateRangePeriod } from './types';

const CAIRO = 'Africa/Cairo';

export function parseDateRange(
  period: DateRangePeriod,
  customFrom?: string,
  customTo?: string,
): DateRange {
  const now = DateTime.now().setZone(CAIRO);
  let start: DateTime;
  let end: DateTime = now.endOf('day');
  let label = 'This week';

  switch (period) {
    case 'last_week':
      start = now.minus({ weeks: 1 }).startOf('week');
      end = now.minus({ weeks: 1 }).endOf('week');
      label = 'Last week';
      break;
    case 'last_30':
      start = now.minus({ days: 30 }).startOf('day');
      label = 'Last 30 days';
      break;
    case 'last_90':
      start = now.minus({ days: 90 }).startOf('day');
      label = 'Last 90 days';
      break;
    case 'custom':
      start = customFrom
        ? DateTime.fromISO(customFrom).startOf('day')
        : now.minus({ days: 7 }).startOf('day');
      end = customTo
        ? DateTime.fromISO(customTo).endOf('day')
        : now.endOf('day');
      label = 'Custom range';
      break;
    default:
      start = now.startOf('week');
      label = 'This week';
  }

  return {
    period,
    start: start.toUTC().toISO()!,
    end: end.toUTC().toISO()!,
    label,
  };
}

export function priorPeriod(range: DateRange): DateRange {
  const start = DateTime.fromISO(range.start);
  const end = DateTime.fromISO(range.end);
  const days = Math.max(1, Math.ceil(end.diff(start, 'days').days));
  const priorEnd = start.minus({ milliseconds: 1 });
  const priorStart = priorEnd.minus({ days }).startOf('day');
  return {
    period: range.period,
    start: priorStart.toUTC().toISO()!,
    end: priorEnd.toUTC().toISO()!,
    label: 'Prior period',
  };
}

export function weekStartingMondayCairo(): string {
  return DateTime.now().setZone(CAIRO).startOf('week').toISODate()!;
}

export function dayLabels(): string[] {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}
