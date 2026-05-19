import type { HeatmapCell } from './types';
import { dayLabels } from './date-range';

/** Human-readable label for the best call-time slot (server-safe — not a client module). */
export function buildBestHourLabel(cell: HeatmapCell | null): string | null {
  if (!cell || cell.calls < 5) return null;
  const days = dayLabels();
  const formatHour = (h: number) =>
    h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
  const nextHour = (cell.hour + 1) % 24;
  return `${days[cell.day]} ${formatHour(cell.hour)}–${formatHour(nextHour)} (${Math.round(cell.connect_rate * 100)}% connect)`;
}
