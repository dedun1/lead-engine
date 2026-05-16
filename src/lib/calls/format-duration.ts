/** Format elapsed seconds as HH:MM:SS for the call timer display. */
export function formatDurationHms(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function elapsedSecondsSince(isoStart: string, frozenAtSeconds?: number): number {
  if (frozenAtSeconds != null) return frozenAtSeconds;
  const start = new Date(isoStart).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / 1000));
}
