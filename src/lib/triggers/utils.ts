import { createHash } from 'crypto';
import { DateTime } from 'luxon';
import {
  buildGoogleMapsLink,
  resolveGooglePlaceId,
} from '@/lib/leads/google-maps-link';
import type { EligibleLead, ReviewCountSnapshot } from './types';

export function isoWeekKey(date = new Date()): string {
  return DateTime.fromJSDate(date).toFormat("yyyy-'W'WW");
}

export function parseReviewHistory(raw: unknown): ReviewCountSnapshot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (e): e is ReviewCountSnapshot =>
        !!e &&
        typeof e === 'object' &&
        typeof (e as ReviewCountSnapshot).checked_at === 'string' &&
        typeof (e as ReviewCountSnapshot).count === 'number',
    )
    .slice(-120);
}

export function snapshotAt(
  history: ReviewCountSnapshot[],
  daysAgo: number,
): ReviewCountSnapshot | null {
  const cutoff = DateTime.now().minus({ days: daysAgo }).toISO();
  let best: ReviewCountSnapshot | null = null;
  for (const h of history) {
    if (h.checked_at <= cutoff!) {
      if (!best || h.checked_at > best.checked_at) best = h;
    }
  }
  return best;
}

export function appendReviewSnapshot(
  history: ReviewCountSnapshot[],
  count: number,
): ReviewCountSnapshot[] {
  const now = new Date().toISOString();
  const next = [...history, { checked_at: now, count }];
  return next.slice(-120);
}

export function growth30d(history: ReviewCountSnapshot[]): {
  current: number;
  prior: number;
} {
  const now = DateTime.now();
  const d30 = now.minus({ days: 30 }).toISO()!;
  const d60 = now.minus({ days: 60 }).toISO()!;
  const sorted = [...history].sort((a, b) => a.checked_at.localeCompare(b.checked_at));
  const atNow = sorted.at(-1)?.count ?? 0;
  const at30 = [...sorted].reverse().find((s) => s.checked_at <= d30)?.count ?? atNow;
  const at60 = [...sorted].reverse().find((s) => s.checked_at <= d60)?.count ?? at30;
  return { current: Math.max(0, atNow - at30), prior: Math.max(0, at30 - at60) };
}

export function sha256Body(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function normalizeVisibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function googleMapsUrlForLead(lead: EligibleLead): string | null {
  const hasPlace = Boolean(resolveGooglePlaceId({ source_log: lead.source_log }));
  const hasGeo =
    lead.latitude != null ||
    lead.longitude != null ||
    Boolean(lead.address?.trim());
  if (!hasPlace && !hasGeo) return null;
  return buildGoogleMapsLink({
    business_name: lead.business_name,
    address: lead.address,
    latitude: lead.latitude,
    longitude: lead.longitude,
    source_log: lead.source_log,
  });
}

export function facebookUrl(lead: EligibleLead): string | null {
  return lead.socials?.facebook ?? null;
}
