import { createClient } from '@/lib/supabase/server';
import type { OpenerPerformanceRow } from '../types';

export type OpenerFilters = {
  nicheId?: string;
  personalizedOnly?: boolean;
  nicheBaselineOnly?: boolean;
  minUses?: number;
};

type OpenerStatRow = {
  opener_variant_id: string;
  used: number;
  answered: number;
  interested: number;
  meetings: number;
  last_called_at: string | null;
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

  const { data: statRows } = await supabase.rpc('dashboard_opener_call_stats', {
    p_start: start,
    p_end: end,
  });

  const stats = new Map<string, OpenerStatRow>();
  for (const row of (statRows ?? []) as unknown as OpenerStatRow[]) {
    stats.set(row.opener_variant_id, row);
  }

  const rows: OpenerPerformanceRow[] = [];

  for (const v of variants) {
    if (filters.personalizedOnly && !v.is_personalized) continue;
    if (filters.nicheBaselineOnly && v.is_personalized) continue;
    if (filters.nicheId && v.niche_id !== filters.nicheId) continue;

    const s = stats.get(v.id);
    const used = s ? Number(s.used) : 0;
    const answered = s ? Number(s.answered) : 0;
    const interested = s ? Number(s.interested) : 0;
    const meetings = s ? Number(s.meetings) : 0;
    const timesUsed = used || v.times_used || 0;

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
      times_answered: answered,
      times_interested: interested,
      meetings_set: meetings || v.meetings_set || 0,
      conversion_rate:
        timesUsed > 0 ? (meetings || v.meetings_set || 0) / timesUsed : 0,
      last_used_at: s?.last_called_at ?? v.updated_at,
    });
  }

  return rows.sort((a, b) => b.conversion_rate - a.conversion_rate);
}
