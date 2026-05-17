import { createClient } from '@/lib/supabase/server';
import type {
  ActivityChipId,
  ActivityFeedEntry,
  ActivityFeedParams,
  ActivityFeedResult,
} from './types';

const LEAD_ACTIVITY_KINDS: ActivityChipId[] = [
  'status_change',
  'enrichment_added',
  'note_added',
  'lead_blocked',
];

function rpcFlags(types: ActivityChipId[] | null) {
  const selected = types ?? [
    'call',
    'status_change',
    'enrichment_added',
    'note_added',
    'lead_blocked',
    'generation',
    'trigger',
  ];
  const includeCalls = selected.includes('call');
  const activityTypes = selected.filter((t) =>
    LEAD_ACTIVITY_KINDS.includes(t as (typeof LEAD_ACTIVITY_KINDS)[number]),
  );
  return {
    p_include_calls: includeCalls,
    p_activity_types: activityTypes.length ? activityTypes : null,
    p_include_generation: selected.includes('generation'),
    p_include_triggers: selected.includes('trigger'),
  };
}

export async function getActivityFeed(
  params: ActivityFeedParams,
): Promise<ActivityFeedResult> {
  const supabase = createClient();
  const flags = rpcFlags(params.activityTypes);

  const { data, error } = await supabase.rpc('get_activity_feed', {
    p_start: params.start,
    p_end: params.end,
    p_user_ids: params.userIds,
    p_include_calls: flags.p_include_calls,
    p_activity_types: flags.p_activity_types,
    p_include_generation: flags.p_include_generation,
    p_include_triggers: flags.p_include_triggers,
    p_lead_search: params.leadSearch,
    p_niche_id: params.nicheId,
    p_cursor: params.cursor,
    p_limit: params.limit ?? 50,
  });

  if (error || !data) {
    console.error('get_activity_feed', error?.message);
    return { entries: [], nextCursor: null };
  }

  const entries: ActivityFeedEntry[] = data.map((row) => ({
    kind: row.kind,
    occurred_at: row.occurred_at,
    user_id: row.user_id,
    lead_id: row.lead_id,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    source_id: row.source_id,
    business_name: row.business_name,
    city: row.city,
    region: row.region,
    niche_name: row.niche_name,
    actor_name: row.actor_name,
  }));

  const last = entries[entries.length - 1];
  const nextCursor =
    entries.length >= (params.limit ?? 50) && last?.occurred_at
      ? last.occurred_at
      : null;

  return { entries, nextCursor };
}
