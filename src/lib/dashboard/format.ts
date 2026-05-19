export function formatPct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function formatDelta(delta: number | null): string {
  if (delta == null) return '—';
  const arrow = delta >= 0 ? '↑' : '↓';
  return `${arrow} ${Math.abs(Math.round(delta))}% vs prior period`;
}

export function conversionColor(rate: number): string {
  if (rate > 0.15) return 'text-chart-3';
  if (rate >= 0.05) return 'text-warning';
  return 'text-destructive';
}

export function sparklineBars(values: number[]): string {
  const max = Math.max(...values, 1);
  return values
    .map((v) => {
      const h = Math.max(4, Math.round((v / max) * 24));
      return `${h}px`;
    })
    .join(' ');
}
