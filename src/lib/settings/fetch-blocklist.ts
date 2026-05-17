import { createClient } from '@/lib/supabase/server';

export type BlocklistRow = {
  id: string;
  fingerprint: string;
  reason: string | null;
  blocked_at: string | null;
  last_reviewed_at: string | null;
  blocked_by: string | null;
  blocker_name: string | null;
  business_name: string | null;
  city: string | null;
  lead_label: string | null;
};

export type BlocklistFetchResult = {
  rows: BlocklistRow[];
  nextCursor: string | null;
  totalCount: number;
};

export async function fetchBlocklistPage(opts: {
  blockedBy?: string[];
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}): Promise<BlocklistFetchResult> {
  const supabase = createClient();
  const limit = opts.limit ?? 50;

  let countQuery = supabase
    .from('blocked_fingerprints')
    .select('*', { count: 'exact', head: true });
  let dataQuery = supabase
    .from('blocked_fingerprints')
    .select(
      `id, fingerprint, reason, blocked_at, last_reviewed_at, blocked_by, business_name, city,
       blocker:team_members!blocked_fingerprints_blocked_by_fkey ( display_name )`,
    )
    .order('blocked_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  const from = opts.from ?? defaultFrom30Days();
  countQuery = countQuery.gte('blocked_at', from);
  dataQuery = dataQuery.gte('blocked_at', from);

  if (opts.to) {
    countQuery = countQuery.lte('blocked_at', opts.to);
    dataQuery = dataQuery.lte('blocked_at', opts.to);
  }
  if (opts.blockedBy?.length) {
    countQuery = countQuery.in('blocked_by', opts.blockedBy);
    dataQuery = dataQuery.in('blocked_by', opts.blockedBy);
  }

  if (opts.cursor) {
    const [ts, id] = Buffer.from(opts.cursor, 'base64').toString('utf8').split('|');
    if (ts && id) {
      dataQuery = dataQuery.or(
        `blocked_at.lt.${ts},and(blocked_at.eq.${ts},id.lt.${id})`,
      );
    }
  }

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
  if (error || !data) {
    return { rows: [], nextCursor: null, totalCount: count ?? 0 };
  }

  const fps = data.map((r) => r.fingerprint);
  const leadByFp = new Map<string, { business_name: string; city: string | null }>();
  if (fps.length) {
    const { data: leads } = await supabase
      .from('leads')
      .select('fingerprint, business_name, city')
      .in('fingerprint', fps);
    for (const l of leads ?? []) {
      if (l.fingerprint && !leadByFp.has(l.fingerprint)) {
        leadByFp.set(l.fingerprint, {
          business_name: l.business_name,
          city: l.city,
        });
      }
    }
  }

  const rows: BlocklistRow[] = data.map((r) => {
    const blocker = r.blocker as { display_name: string | null } | null;
    const lead = leadByFp.get(r.fingerprint);
    const label = lead
      ? `${lead.business_name}${lead.city ? ` · ${lead.city}` : ''}`
      : r.business_name
        ? `${r.business_name}${r.city ? ` · ${r.city}` : ''}`
        : null;
    return {
      id: r.id,
      fingerprint: r.fingerprint,
      reason: r.reason,
      blocked_at: r.blocked_at,
      last_reviewed_at: r.last_reviewed_at,
      blocked_by: r.blocked_by,
      blocker_name: blocker?.display_name ?? null,
      business_name: r.business_name,
      city: r.city,
      lead_label: label,
    };
  });

  const last = data[data.length - 1];
  const nextCursor =
    data.length === limit && last?.blocked_at
      ? Buffer.from(`${last.blocked_at}|${last.id}`).toString('base64')
      : null;

  return { rows, nextCursor, totalCount: count ?? 0 };
}

function defaultFrom30Days(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

export async function fetchBlocklistBlockers(): Promise<
  { id: string; display_name: string | null }[]
> {
  const supabase = createClient();
  const { data } = await supabase
    .from('team_members')
    .select('id, display_name')
    .eq('is_active', true)
    .order('display_name');
  return data ?? [];
}
