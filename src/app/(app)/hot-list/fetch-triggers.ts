import { createClient } from '@/lib/supabase/server';
import type { TriggerType } from '@/lib/triggers/types';

export type HotListTrigger = {
  id: string;
  lead_id: string;
  trigger_type: TriggerType;
  severity: string | null;
  detected_at: string | null;
  expires_at: string | null;
  details: Record<string, unknown> | null;
  lead: {
    id: string;
    business_name: string;
    city: string | null;
    region: string | null;
    business_phone: string | null;
    niche_id: string | null;
    assigned_to: string | null;
    niches: { name: string } | null;
  };
};

export async function fetchActiveTriggers(opts: {
  types?: TriggerType[];
  severities?: string[];
  nicheIds?: string[];
  regions?: string[];
  myQueueOnly?: boolean;
  userId?: string;
  search?: string;
  sort?: 'severity' | 'detected_at' | 'lead_name';
}): Promise<HotListTrigger[]> {
  const supabase = createClient();
  const now = new Date().toISOString();

  let q = supabase
    .from('trigger_events')
    .select(
      `id, lead_id, trigger_type, severity, detected_at, expires_at, details,
       leads!inner ( id, business_name, city, region, business_phone, niche_id, assigned_to, niches ( name ) )`,
    )
    .eq('is_actioned', false)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (opts.types?.length) q = q.in('trigger_type', opts.types);
  if (opts.severities?.length) q = q.in('severity', opts.severities);
  if (opts.nicheIds?.length) q = q.in('leads.niche_id', opts.nicheIds);
  if (opts.regions?.length) q = q.in('leads.region', opts.regions);
  if (opts.myQueueOnly && opts.userId) {
    q = q.eq('leads.assigned_to', opts.userId);
  }

  const { data, error } = await q;
  if (error || !data) return [];

  let rows = data.map((row) => {
    const lead = row.leads as HotListTrigger['lead'];
    return {
      id: row.id,
      lead_id: row.lead_id!,
      trigger_type: row.trigger_type as TriggerType,
      severity: row.severity,
      detected_at: row.detected_at,
      expires_at: row.expires_at,
      details: row.details as Record<string, unknown> | null,
      lead,
    };
  });

  if (opts.search) {
    const s = opts.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.lead.business_name.toLowerCase().includes(s) ||
        (r.lead.city ?? '').toLowerCase().includes(s),
    );
  }

  const sevRank: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  rows.sort((a, b) => {
    if (opts.sort === 'lead_name') {
      return a.lead.business_name.localeCompare(b.lead.business_name);
    }
    if (opts.sort === 'detected_at') {
      return (b.detected_at ?? '').localeCompare(a.detected_at ?? '');
    }
    const sd = (sevRank[b.severity ?? ''] ?? 0) - (sevRank[a.severity ?? ''] ?? 0);
    if (sd !== 0) return sd;
    return (b.detected_at ?? '').localeCompare(a.detected_at ?? '');
  });

  return rows;
}

export async function fetchLastTriggerRefresh(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('scraper_health')
    .select('last_check_at')
    .eq('source', 'trigger_coordinator')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.last_check_at ?? null;
}
