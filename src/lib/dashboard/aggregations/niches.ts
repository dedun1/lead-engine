import { createClient } from '@/lib/supabase/server';
import type { NichePerformanceRow } from '../types';
import { isAnswered, isInterested, isMeeting } from '../call-metrics';

export async function getNichePerformance(
  start: string,
  end: string,
): Promise<NichePerformanceRow[]> {
  const supabase = createClient();

  const { data: niches } = await supabase
    .from('niches')
    .select('id, name, naics_code');

  if (!niches?.length) return [];

  const { data: leadCounts } = await supabase
    .from('leads')
    .select('niche_id')
    .not('niche_id', 'is', null);

  const leadsByNiche = new Map<string, number>();
  for (const l of leadCounts ?? []) {
    if (!l.niche_id) continue;
    leadsByNiche.set(l.niche_id, (leadsByNiche.get(l.niche_id) ?? 0) + 1);
  }

  const { data: calls } = await supabase
    .from('call_attempts')
    .select('outcome, sub_outcome, sentiment_score, leads!inner(niche_id)')
    .gte('called_at', start)
    .lte('called_at', end);

  const { data: jobs } = await supabase
    .from('generation_jobs')
    .select('niche_id, actual_cost_usd')
    .gte('created_at', start)
    .lte('created_at', end);

  const costByNiche = new Map<string, number>();
  for (const j of jobs ?? []) {
    if (!j.niche_id) continue;
    costByNiche.set(
      j.niche_id,
      (costByNiche.get(j.niche_id) ?? 0) + (j.actual_cost_usd ?? 0),
    );
  }

  type NicheAgg = {
    calls: number;
    answered: number;
    interested: number;
    meetings: number;
    sentimentSum: number;
    sentimentCount: number;
  };

  const agg = new Map<string, NicheAgg>();

  for (const c of calls ?? []) {
    const lead = c.leads as { niche_id: string } | null;
    const nid = lead?.niche_id;
    if (!nid) continue;
    const a = agg.get(nid) ?? {
      calls: 0,
      answered: 0,
      interested: 0,
      meetings: 0,
      sentimentSum: 0,
      sentimentCount: 0,
    };
    a.calls += 1;
    if (isAnswered(c.outcome)) a.answered += 1;
    if (isInterested(c.sub_outcome)) a.interested += 1;
    if (isMeeting(c.sub_outcome)) a.meetings += 1;
    if (c.sentiment_score != null) {
      a.sentimentSum += c.sentiment_score;
      a.sentimentCount += 1;
    }
    agg.set(nid, a);
  }

  return niches.map((n) => {
    const a = agg.get(n.id) ?? {
      calls: 0,
      answered: 0,
      interested: 0,
      meetings: 0,
      sentimentSum: 0,
      sentimentCount: 0,
    };
    const connect = a.calls > 0 ? a.answered / a.calls : 0;
    const interestedRate = a.answered > 0 ? a.interested / a.answered : 0;
    const cost = costByNiche.get(n.id) ?? 0;
    let status: NichePerformanceRow['status'] = 'inconclusive';
    if (a.calls < 5) status = 'inconclusive';
    else if (interestedRate > 0.1) status = 'worth';
    else if (a.calls >= 10 && interestedRate < 0.03) status = 'skip';
    else status = 'inconclusive';

    return {
      niche_id: n.id,
      niche_name: n.name,
      naics_code: n.naics_code,
      total_leads: leadsByNiche.get(n.id) ?? 0,
      calls: a.calls,
      connect_rate: connect,
      interested_rate: interestedRate,
      meetings: a.meetings,
      avg_sentiment:
        a.sentimentCount > 0 ? a.sentimentSum / a.sentimentCount : null,
      cost_per_meeting:
        a.meetings > 0 ? cost / a.meetings : null,
      status,
    };
  });
}
