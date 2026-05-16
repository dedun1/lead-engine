import { createClient } from '@/lib/supabase/server';
import type { OpenerPerformanceRow } from '../types';
import { isAnswered, isInterested, isMeeting } from '../call-metrics';

export type OpenerFilters = {
  nicheId?: string;
  personalizedOnly?: boolean;
  nicheBaselineOnly?: boolean;
  minUses?: number;
};

export async function getOpenerPerformance(
  start: string,
  end: string,
  filters: OpenerFilters = {},
): Promise<OpenerPerformanceRow[]> {
  const supabase = createClient();
  const { data: variants } = await supabase
    .from('pitch_opener_variants')
    .select(
      'id, hook_type, opener_text, is_personalized, times_used, meetings_set, updated_at, niche_id, lead_id, niches(name), leads(business_name)',
    );

  if (!variants?.length) return [];

  const { data: calls } = await supabase
    .from('call_attempts')
    .select('opener_variant_id, outcome, sub_outcome, called_at')
    .gte('called_at', start)
    .lte('called_at', end)
    .not('opener_variant_id', 'is', null);

  const stats = new Map<
    string,
    {
      answered: number;
      interested: number;
      meetings: number;
      used: number;
      lastAt: string | null;
    }
  >();

  for (const c of calls ?? []) {
    const vid = c.opener_variant_id!;
    const s = stats.get(vid) ?? {
      answered: 0,
      interested: 0,
      meetings: 0,
      used: 0,
      lastAt: null,
    };
    s.used += 1;
    if (isAnswered(c.outcome)) s.answered += 1;
    if (isInterested(c.sub_outcome)) s.interested += 1;
    if (isMeeting(c.sub_outcome)) s.meetings += 1;
    if (c.called_at && (!s.lastAt || c.called_at > s.lastAt)) {
      s.lastAt = c.called_at;
    }
    stats.set(vid, s);
  }

  const rows: OpenerPerformanceRow[] = [];

  for (const v of variants) {
    if (filters.personalizedOnly && !v.is_personalized) continue;
    if (filters.nicheBaselineOnly && v.is_personalized) continue;
    if (filters.nicheId && v.niche_id !== filters.nicheId) continue;

    const s = stats.get(v.id) ?? {
      answered: 0,
      interested: 0,
      meetings: 0,
      used: 0,
      lastAt: null,
    };
    const timesUsed = s.used || v.times_used || 0;
    if (filters.minUses != null && timesUsed < filters.minUses) continue;

    const nicheJoin = v.niches as { name: string } | null;
    const leadJoin = v.leads as { business_name: string } | null;

    rows.push({
      id: v.id,
      hook_type: v.hook_type,
      opener_text: v.opener_text ?? '',
      is_personalized: Boolean(v.is_personalized),
      niche_id: v.niche_id,
      niche_name: nicheJoin?.name ?? null,
      business_name: leadJoin?.business_name ?? null,
      times_used: timesUsed,
      times_answered: s.answered,
      times_interested: s.interested,
      meetings_set: s.meetings || v.meetings_set || 0,
      conversion_rate: timesUsed > 0 ? (s.meetings || v.meetings_set || 0) / timesUsed : 0,
      last_used_at: s.lastAt ?? v.updated_at,
    });
  }

  return rows.sort((a, b) => b.conversion_rate - a.conversion_rate);
}
