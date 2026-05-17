/** Sources with on-demand health checks — client-safe list (no Playwright imports). */
export const HEALTH_CHECK_SOURCES = ['google_maps'] as const;

export function hasHealthCheck(source: string): boolean {
  return (HEALTH_CHECK_SOURCES as readonly string[]).includes(source);
}
