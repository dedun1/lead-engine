import type { ScraperHealthRow } from '@/lib/health/fetch-sources';

export type DisplayHealthStatus = 'healthy' | 'degraded' | 'down' | 'disabled';

export function displayHealthStatus(row: ScraperHealthRow): DisplayHealthStatus {
  if (row.is_disabled) return 'disabled';
  const fails = row.consecutive_failures ?? 0;
  if (fails >= 3 || row.status === 'down') return 'down';
  if (fails >= 1 || row.status === 'degraded') return 'degraded';
  return 'healthy';
}

export function aggregateHealthCounts(rows: ScraperHealthRow[]) {
  const counts = { healthy: 0, degraded: 0, down: 0, disabled: 0 };
  for (const row of rows) {
    counts[displayHealthStatus(row)] += 1;
  }
  return counts;
}

export const STATUS_BADGE: Record<DisplayHealthStatus, string> = {
  healthy: 'bg-emerald-500/15 text-emerald-800',
  degraded: 'bg-amber-500/15 text-amber-800',
  down: 'bg-red-500/15 text-red-800',
  disabled: 'bg-slate-500/15 text-slate-600',
};
