import { logEnrichmentSourceHealth } from '@/lib/enrich/scraper-health';
import { healthCheck as googleMapsHealthCheck } from '@/lib/scrape/google-maps';

export type HealthCheckResult = {
  ok: boolean;
  latency_ms?: number;
  error?: string;
};

export type SourceHealthRunner = () => Promise<HealthCheckResult>;

/** Sources with an implemented on-demand health check. */
const IMPLEMENTED: Record<string, SourceHealthRunner> = {
  google_maps: async () => {
    const r = await googleMapsHealthCheck();
    return { ok: r.ok, latency_ms: r.latency_ms, error: r.error };
  },
};

export function hasHealthCheck(source: string): boolean {
  return source in IMPLEMENTED;
}

export async function runSourceHealthCheck(
  source: string,
): Promise<HealthCheckResult | null> {
  const fn = IMPLEMENTED[source];
  if (!fn) return null;
  const result = await fn();
  await logEnrichmentSourceHealth(source, result.ok, result.error);
  return result;
}

export function listImplementedHealthCheckSources(): string[] {
  return Object.keys(IMPLEMENTED);
}
