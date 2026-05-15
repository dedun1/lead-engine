const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 10;

const buckets = new Map<string, number[]>();

/** In-memory per-user rate limit for niche card generation. */
export function allowNicheCardGeneration(userId: string): boolean {
  const now = Date.now();
  const recent = (buckets.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  buckets.set(userId, recent);
  return true;
}

export function retryAfterSeconds(userId: string): number {
  const now = Date.now();
  const recent = buckets.get(userId) ?? [];
  if (recent.length < MAX_REQUESTS) return 0;
  const oldest = Math.min(...recent);
  return Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
}
