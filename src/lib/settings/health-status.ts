import type { ScraperHealthRow } from '@/lib/health/fetch-sources';
import { HEALTH_STATUS_CLASS } from '@/lib/ui/semantic-classes';

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

export const STATUS_BADGE: Record<DisplayHealthStatus, string> =
  HEALTH_STATUS_CLASS as Record<DisplayHealthStatus, string>;
