export function sectorBadgeClass(sector: string | null): string {
  const map: Record<string, string> = {
    Construction: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Health Care': 'bg-green-500/15 text-green-400 border-green-500/30',
    'Personal Services': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Food Service': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'Professional Services':
      'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    Retail: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    'Auto Services': 'bg-red-500/15 text-red-400 border-red-500/30',
    'Real Estate': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    Fitness: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  };
  return map[sector ?? ''] ?? 'bg-muted text-muted-foreground border-border';
}

export const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
  UK: '🇬🇧',
  AU: '🇦🇺',
};
