/** Activity feed kinds — maps to UNION branches in get_activity_feed RPC. */

export const FEED_KIND_CALL = 'call' as const;
export const FEED_KIND_GENERATION = 'generation' as const;
export const FEED_KIND_TRIGGER = 'trigger' as const;

export const ACTIVITY_TYPE_CHIPS = [
  { id: 'call', label: 'Calls', rpc: 'call' as const },
  { id: 'status_change', label: 'Status changes', rpc: 'activity' as const },
  { id: 'enrichment_added', label: 'Enrichments', rpc: 'activity' as const },
  { id: 'note_added', label: 'Notes', rpc: 'activity' as const },
  { id: 'lead_blocked', label: 'Blocks', rpc: 'activity' as const },
  { id: 'generation', label: 'Generation jobs', rpc: 'generation' as const },
  { id: 'trigger', label: 'Triggers', rpc: 'trigger' as const },
] as const;

export type ActivityChipId = (typeof ACTIVITY_TYPE_CHIPS)[number]['id'];

export type ActivityFeedEntry = {
  kind: string;
  occurred_at: string;
  user_id: string | null;
  lead_id: string | null;
  payload: Record<string, unknown>;
  source_id: string;
  business_name: string | null;
  city: string | null;
  region: string | null;
  niche_name: string | null;
  actor_name: string | null;
};

export type ActivityFeedParams = {
  userIds: string[] | null;
  start: string;
  end: string;
  activityTypes: ActivityChipId[] | null;
  leadSearch: string | null;
  nicheId: string | null;
  cursor: string | null;
  limit?: number;
};

export type ActivityFeedResult = {
  entries: ActivityFeedEntry[];
  nextCursor: string | null;
};
