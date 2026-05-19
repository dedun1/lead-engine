export function sectorBadgeClass(sector: string | null): string {
  const map: Record<string, string> = {
    Construction: 'bg-chart-1/15 text-chart-1 border border-chart-1/30',
    'Health Care': 'bg-chart-3/15 text-chart-3 border border-chart-3/30',
    'Personal Services': 'bg-primary/10 text-primary border border-primary/25',
    'Food Service': 'bg-chart-5/15 text-chart-5 border border-chart-5/30',
    'Professional Services': 'bg-chart-2/15 text-chart-2 border border-chart-2/30',
    Retail: 'bg-accent text-accent-foreground border border-border',
    'Auto Services': 'bg-destructive/15 text-destructive border border-destructive/30',
    'Real Estate': 'bg-chart-4/15 text-chart-4 border border-chart-4/30',
    Fitness: 'bg-chart-2/15 text-chart-2 border border-chart-2/30',
  };
  return map[sector ?? ''] ?? 'bg-muted text-muted-foreground border border-border';
}

export const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
  UK: '🇬🇧',
  AU: '🇦🇺',
};
