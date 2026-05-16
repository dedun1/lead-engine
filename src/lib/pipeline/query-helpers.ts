import type { PipelineFilters } from './types';
import { createClient } from '@/lib/supabase/server';

export function dateCutoff(range: PipelineFilters['dateRange']): string | null {
  const now = new Date();
  if (range === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === '7d') {
    return new Date(now.getTime() - 7 * 86400000).toISOString();
  }
  if (range === '30d') {
    return new Date(now.getTime() - 30 * 86400000).toISOString();
  }
  return null;
}

export async function pitchingNicheIds(
  supabase: ReturnType<typeof createClient>,
): Promise<string[] | null> {
  const { data } = await supabase
    .from('niches')
    .select('id')
    .eq('is_actively_pitching', true);
  return data?.map((n) => n.id) ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyLeadFilters(q: any, filters: PipelineFilters, pitchingIds: string[] | null) {
  let query = q.eq('is_blocked', false);
  if (filters.nicheId) query = query.eq('niche_id', filters.nicheId);
  else if (filters.pitchingNichesOnly !== false && pitchingIds?.length) {
    query = query.in('niche_id', pitchingIds);
  }
  if (filters.country) query = query.eq('country', filters.country);
  if (filters.region) query = query.eq('region', filters.region);
  if (filters.city) query = query.eq('city', filters.city);
  if (filters.statuses?.length) query = query.in('status', filters.statuses);
  const since = dateCutoff(filters.dateRange ?? 'all');
  if (since) query = query.gte('created_at', since);
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`business_name.ilike.${term},business_phone.ilike.${term}`);
  }
  return query;
}
