import type { EnrichLead, EnrichedFields } from '@/lib/enrich/types';
import { makeLogEntry } from '@/lib/enrich/merge';

const STATE_FROM_REGION: Record<string, string> = {
  TX: 'TX',
  TEXAS: 'TX',
  CA: 'CA',
  CALIFORNIA: 'CA',
  FL: 'FL',
  FLORIDA: 'FL',
  NY: 'NY',
  'NEW YORK': 'NY',
  PA: 'PA',
  PENNSYLVANIA: 'PA',
  IL: 'IL',
  ILLINOIS: 'IL',
  OH: 'OH',
  OHIO: 'OH',
  GA: 'GA',
  GEORGIA: 'GA',
  NC: 'NC',
  'NORTH CAROLINA': 'NC',
  MI: 'MI',
  MICHIGAN: 'MI',
};

export function leadUsState(lead: EnrichLead): string | null {
  const c = lead.country?.toUpperCase();
  if (c !== 'US' && c !== 'USA') return null;
  const r = (lead.region ?? '').toUpperCase().trim();
  return STATE_FROM_REGION[r] ?? (r.length === 2 ? r : null);
}

export function officerOwnerCandidate(
  officers: Array<{ name: string; role: string }>,
): string | undefined {
  const roleMatch = /president|ceo|owner|member|manager|director/i;
  const hit = officers.find((o) => roleMatch.test(o.role));
  return hit?.name ?? officers[0]?.name;
}

export function skipLog(
  source: string,
  reason: string,
  durationMs: number,
): Partial<EnrichedFields> {
  return {
    source_log: [makeLogEntry(source, false, [], durationMs, reason)],
  };
}

export function successLog(
  source: string,
  patch: Partial<EnrichedFields>,
  durationMs: number,
): Partial<EnrichedFields> {
  const fields = Object.keys(patch).filter((k) => k !== 'source_log');
  return {
    ...patch,
    source_log: [makeLogEntry(source, fields.length > 0, fields, durationMs)],
  };
}

let lastSosQueryAt = 0;

export async function throttleSos(): Promise<void> {
  const wait = Math.max(0, 6000 - (Date.now() - lastSosQueryAt));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastSosQueryAt = Date.now();
}
