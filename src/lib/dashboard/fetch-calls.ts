import { createClient } from '@/lib/supabase/server';
import { parseTags, type SlimCall } from './call-metrics';

/** Slim call rows for a date range — used by heatmap, tags, sentiment aggregations. */
export async function fetchCallsInRange(
  start: string,
  end: string,
): Promise<SlimCall[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('call_attempts')
    .select(
      'id, called_at, outcome, sub_outcome, opener_variant_id, prospect_local_day, prospect_local_hour, sentiment_score, tags, lead_id, leads(niche_id)',
    )
    .gte('called_at', start)
    .lte('called_at', end)
    .not('called_at', 'is', null);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    called_at: row.called_at,
    outcome: row.outcome,
    sub_outcome: row.sub_outcome,
    opener_variant_id: row.opener_variant_id,
    prospect_local_day: row.prospect_local_day,
    prospect_local_hour: row.prospect_local_hour,
    sentiment_score: row.sentiment_score,
    tags: parseTags(row.tags),
    lead_id: row.lead_id,
    niche_id: (row.leads as { niche_id: string | null } | null)?.niche_id ?? null,
  }));
}
