import { createClient } from '@/lib/supabase/server';
import type { NichePerformanceRow } from '../types';

type LeadCountRow = { niche_id: string; total: number };
type CallStatRow = {
  niche_id: string;
  calls: number;
  answered: number;
  interested: number;
  meetings: number;
  sentiment_sum: number;
  sentiment_count: number;
};
type CostRow = { niche_id: string; total_cost: number };

export async function getNichePerformance(
  start: string,
  end: string,
): Promise<NichePerformanceRow[]> {
  const supabase = createClient();

  const { data: niches } = await supabase
    .from('niches')
    .select('id, name, naics_code');

  if (!niches?.length) return [];

  const [leadCountsRes, callStatsRes, costRes] = await Promise.all([
    supabase.rpc('dashboard_lead_counts_by_niche'),
    supabase.rpc('dashboard_niche_call_stats', {
      p_start: start,
      p_end: end,
    }),
    supabase.rpc('dashboard_generation_cost_by_niche', {
      p_start: start,
      p_end: end,
    }),
  ]);

  const leadsByNiche = new Map<string, number>();
  for (const row of (leadCountsRes.data ?? []) as unknown as LeadCountRow[]) {
    leadsByNiche.set(row.niche_id, Number(row.total));
  }

  const agg = new Map<string, CallStatRow>();
  for (const row of (callStatsRes.data ?? []) as unknown as CallStatRow[]) {
    agg.set(row.niche_id, row);
  }

  const costByNiche = new Map<string, number>();
  for (const row of (costRes.data ?? []) as unknown as CostRow[]) {
    costByNiche.set(row.niche_id, Number(row.total_cost));
  }

  return niches.map((n) => {
    const a = agg.get(n.id);
    const calls = a ? Number(a.calls) : 0;
    const answered = a ? Number(a.answered) : 0;
    const interested = a ? Number(a.interested) : 0;
    const meetings = a ? Number(a.meetings) : 0;
    const sentimentCount = a ? Number(a.sentiment_count) : 0;
    const sentimentSum = a ? Number(a.sentiment_sum) : 0;

    const connect = calls > 0 ? answered / calls : 0;
    const interestedRate = answered > 0 ? interested / answered : 0;
    const cost = costByNiche.get(n.id) ?? 0;

    let status: NichePerformanceRow['status'] = 'inconclusive';
    if (calls < 5) status = 'inconclusive';
    else if (interestedRate > 0.1) status = 'worth';
    else if (calls >= 10 && interestedRate < 0.03) status = 'skip';
    else status = 'inconclusive';

    return {
      niche_id: n.id,
      niche_name: n.name,
      naics_code: n.naics_code,
      total_leads: leadsByNiche.get(n.id) ?? 0,
      calls,
      connect_rate: connect,
      interested_rate: interestedRate,
      meetings,
      avg_sentiment: sentimentCount > 0 ? sentimentSum / sentimentCount : null,
      cost_per_meeting: meetings > 0 ? cost / meetings : null,
      status,
    };
  });
}
