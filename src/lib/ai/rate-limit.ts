const WINDOW_MS = 5 * 60 * 1000;
const MAX_NICHE_CARD = 10;
const MAX_OPENER = 20;

const nicheCardBuckets = new Map<string, number[]>();
const openerBuckets = new Map<string, number[]>();

function allowInBucket(
  buckets: Map<string, number[]>,
  userId: string,
  max: number,
): boolean {
  const now = Date.now();
  const recent = (buckets.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) return false;
  recent.push(now);
  buckets.set(userId, recent);
  return true;
}

function retryForBucket(buckets: Map<string, number[]>, userId: string, max: number): number {
  const now = Date.now();
  const recent = buckets.get(userId) ?? [];
  if (recent.length < max) return 0;
  const oldest = Math.min(...recent);
  return Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
}

/** In-memory per-user rate limit for niche card generation. */
export function allowNicheCardGeneration(userId: string): boolean {
  return allowInBucket(nicheCardBuckets, userId, MAX_NICHE_CARD);
}

export function retryAfterSeconds(userId: string): number {
  return retryForBucket(nicheCardBuckets, userId, MAX_NICHE_CARD);
}

/** In-memory per-user rate limit for opener generation (P14). */
export function allowOpenerGeneration(userId: string): boolean {
  return allowInBucket(openerBuckets, userId, MAX_OPENER);
}

export function openerRetryAfterSeconds(userId: string): number {
  return retryForBucket(openerBuckets, userId, MAX_OPENER);
}
