/** Shared helpers for call_attempts outcome classification. */

export const POSITIVE_SUB_OUTCOMES = [
  'interested',
  'follow_up_requested',
  'booked_meeting',
] as const;

export function isAnswered(outcome: string | null): boolean {
  return outcome === 'answered';
}

export function isInterested(sub: string | null): boolean {
  return sub != null && (POSITIVE_SUB_OUTCOMES as readonly string[]).includes(sub);
}

export function isMeeting(sub: string | null): boolean {
  return sub === 'booked_meeting';
}

export type SlimCall = {
  id: string;
  called_at: string | null;
  outcome: string | null;
  sub_outcome: string | null;
  opener_variant_id: string | null;
  prospect_local_day: number | null;
  prospect_local_hour: number | null;
  sentiment_score: number | null;
  tags: string[] | null;
  lead_id: string | null;
  niche_id: string | null;
};

export function parseTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === 'string');
}
