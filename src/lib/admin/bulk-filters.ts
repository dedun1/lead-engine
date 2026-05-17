import type { LeadStatus } from '@/lib/pipeline/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export type BulkLeadFilters = {
  niche_id: string;
  region?: string;
  statuses?: LeadStatus[];
  assigned_to?: string;
};

type Db = SupabaseClient<Database>;

export async function countLeadsMatching(
  supabase: Db,
  filters: BulkLeadFilters,
): Promise<number> {
  let q = supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('niche_id', filters.niche_id);
  if (filters.region) q = q.eq('region', filters.region);
  if (filters.statuses?.length) q = q.in('status', filters.statuses);
  if (filters.assigned_to) q = q.eq('assigned_to', filters.assigned_to);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function fetchLeadIdsMatching(
  supabase: Db,
  filters: BulkLeadFilters,
  limit = 5000,
): Promise<string[]> {
  let q = supabase.from('leads').select('id').eq('niche_id', filters.niche_id).limit(limit);
  if (filters.region) q = q.eq('region', filters.region);
  if (filters.statuses?.length) q = q.in('status', filters.statuses);
  if (filters.assigned_to) q = q.eq('assigned_to', filters.assigned_to);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.id);
}
