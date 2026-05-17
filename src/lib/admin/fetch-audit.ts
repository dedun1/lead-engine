import { createClient } from '@/lib/supabase/server';
import { ADMIN_AUDIT_TYPES } from './audit';

export type AuditRow = {
  id: string;
  created_at: string;
  activity_type: string | null;
  actor_id: string | null;
  lead_id: string | null;
  payload: Record<string, unknown> | null;
  actor_name: string | null;
  business_name: string | null;
  city: string | null;
};

export async function fetchAuditLog(params: {
  start?: string;
  end?: string;
  actor_ids?: string[];
  activity_types?: string[];
  cursor?: string | null;
  limit?: number;
}): Promise<{ rows: AuditRow[]; nextCursor: string | null }> {
  const supabase = createClient();
  const limit = params.limit ?? 50;

  let q = supabase
    .from('lead_activities')
    .select(
      'id, created_at, activity_type, actor_id, lead_id, payload, team_members(display_name, email), leads(business_name, city)',
    )
    .in('activity_type', [...ADMIN_AUDIT_TYPES])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (params.start) q = q.gte('created_at', params.start);
  if (params.end) q = q.lte('created_at', params.end);
  if (params.actor_ids?.length) q = q.in('actor_id', params.actor_ids);
  if (params.activity_types?.length) {
    q = q.in('activity_type', params.activity_types);
  }
  if (params.cursor) q = q.lt('created_at', params.cursor);

  const { data, error } = await q;
  if (error) {
    console.error('fetchAuditLog', error.message);
    return { rows: [], nextCursor: null };
  }

  const rows: AuditRow[] = (data ?? []).map((r) => {
    const tm = r.team_members as { display_name: string | null; email: string } | null;
    const lead = r.leads as { business_name: string; city: string | null } | null;
    return {
      id: r.id,
      created_at: r.created_at ?? '',
      activity_type: r.activity_type,
      actor_id: r.actor_id,
      lead_id: r.lead_id,
      payload: (r.payload ?? {}) as Record<string, unknown>,
      actor_name: tm?.display_name ?? tm?.email ?? (r.actor_id ? null : 'System'),
      business_name: lead?.business_name ?? null,
      city: lead?.city ?? null,
    };
  });

  const last = rows[rows.length - 1];
  const nextCursor =
    rows.length >= limit && last?.created_at ? last.created_at : null;

  return { rows, nextCursor };
}
