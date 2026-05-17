'use server';

import { createClient } from '@/lib/supabase/server';
import {
  applyLeadFilters,
  pitchingNicheIds,
} from '@/lib/pipeline/query-helpers';
import type {
  FetchLeadsResult,
  LeadDetail,
  LeadStatus,
  PipelineFilters,
  PitchingNiche,
} from '@/lib/pipeline/types';

export async function fetchPitchingNiches(): Promise<PitchingNiche[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('niches')
    .select('id, name, naics_code')
    .eq('is_actively_pitching', true)
    .order('name');
  return data ?? [];
}

export async function fetchTeamMembers() {
  const supabase = createClient();
  const { data } = await supabase
    .from('team_members')
    .select('id, display_name, email')
    .eq('is_active', true)
    .order('display_name');
  return data ?? [];
}

export async function fetchLeads(
  filters: PipelineFilters,
): Promise<FetchLeadsResult> {
  const supabase = createClient();
  const pitchingIds = filters.nicheId
    ? null
    : await pitchingNicheIds(supabase);

  let countQuery = supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  countQuery = applyLeadFilters(countQuery, filters, pitchingIds);
  const { count } = await countQuery;

  const sort = filters.sort ?? 'created_at';
  const asc = filters.sortDir === 'asc';

  let dataQuery = supabase.from('leads').select(
    `id, business_name, status, business_phone, city, region, country,
     google_rating, google_review_count, business_hours, timezone,
     assigned_to, created_at, niche_id, owner_name, owner_email,
     owner_email_status, enriched_at,
     niches ( name ),
     assignee:team_members!leads_assigned_to_fkey ( display_name )`,
  );
  dataQuery = applyLeadFilters(dataQuery, filters, pitchingIds);

  if (filters.cursor) {
    const [ts, id] = Buffer.from(filters.cursor, 'base64')
      .toString('utf8')
      .split('|');
    if (ts && id) {
      dataQuery = dataQuery.or(
        `created_at.lt.${ts},and(created_at.eq.${ts},id.lt.${id})`,
      );
    }
  }

  if (sort === 'business_name') {
    dataQuery = dataQuery.order('business_name', { ascending: asc });
  } else if (sort === 'status') {
    dataQuery = dataQuery.order('status', { ascending: asc });
  } else if (sort === 'rating') {
    dataQuery = dataQuery.order('google_rating', {
      ascending: asc,
      nullsFirst: false,
    });
  } else {
    dataQuery = dataQuery
      .order('created_at', { ascending: asc })
      .order('id', { ascending: asc });
  }

  const { data, error } = await dataQuery.limit(50);
  if (error || !data) {
    return { leads: [], nextCursor: null, totalCount: count ?? 0 };
  }

  const ids = data.map((r) => r.id);
  const activityMap = new Map<
    string,
    { created_at: string; activity_type: string }
  >();
  const triggerCountMap = new Map<string, number>();
  if (ids.length) {
    const now = new Date().toISOString();
    const [{ data: acts }, { data: triggers }] = await Promise.all([
      supabase
        .from('lead_activities')
        .select('lead_id, created_at, activity_type')
        .in('lead_id', ids)
        .order('created_at', { ascending: false }),
      supabase
        .from('trigger_events')
        .select('lead_id')
        .in('lead_id', ids)
        .eq('is_actioned', false)
        .or(`expires_at.is.null,expires_at.gt.${now}`),
    ]);
    for (const a of acts ?? []) {
      if (a.lead_id && !activityMap.has(a.lead_id)) {
        activityMap.set(a.lead_id, {
          created_at: a.created_at!,
          activity_type: a.activity_type ?? '',
        });
      }
    }
    for (const t of triggers ?? []) {
      if (!t.lead_id) continue;
      triggerCountMap.set(t.lead_id, (triggerCountMap.get(t.lead_id) ?? 0) + 1);
    }
  }

  let leads = data.map((row) => {
    const niche = row.niches as { name: string } | null;
    const assignee = row.assignee as { display_name: string | null } | null;
    const act = activityMap.get(row.id);
    return {
      id: row.id,
      business_name: row.business_name,
      status: row.status as LeadStatus,
      business_phone: row.business_phone,
      city: row.city,
      region: row.region,
      country: row.country,
      google_rating: row.google_rating,
      google_review_count: row.google_review_count,
      business_hours: row.business_hours,
      timezone: row.timezone,
      assigned_to: row.assigned_to,
      assignee_name: assignee?.display_name ?? null,
      last_activity_at: act?.created_at ?? null,
      last_activity_type: act?.activity_type ?? null,
      created_at: row.created_at!,
      niche_id: row.niche_id,
      niche_name: niche?.name ?? null,
      owner_name: row.owner_name,
      owner_email: row.owner_email,
      owner_email_status: row.owner_email_status,
      enriched_at: row.enriched_at,
      active_trigger_count: triggerCountMap.get(row.id) ?? 0,
    };
  });

  if (sort === 'last_activity_at') {
    leads = [...leads].sort((a, b) => {
      const ta = a.last_activity_at ?? '';
      const tb = b.last_activity_at ?? '';
      return asc ? ta.localeCompare(tb) : tb.localeCompare(ta);
    });
  }

  const last = data[data.length - 1];
  const nextCursor =
    data.length === 50 && last?.created_at
      ? Buffer.from(`${last.created_at}|${last.id}`).toString('base64')
      : null;

  return { leads, nextCursor, totalCount: count ?? 0 };
}

export async function fetchLeadById(leadId: string): Promise<LeadDetail | null> {
  const supabase = createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('is_blocked', false)
    .maybeSingle();
  if (!lead) return null;

  const { data: niche } = lead.niche_id
    ? await supabase
        .from('niches')
        .select('id, name, naics_code')
        .eq('id', lead.niche_id)
        .maybeSingle()
    : { data: null };

  let nicheIntelligence = null;
  if (lead.niche_id && lead.country) {
    const { data: intel } = await supabase
      .from('niche_intelligence')
      .select('*')
      .eq('niche_id', lead.niche_id)
      .eq('country', lead.country)
      .maybeSingle();
    nicheIntelligence = intel;
  }

  const { data: assignee } = lead.assigned_to
    ? await supabase
        .from('team_members')
        .select('id, display_name')
        .eq('id', lead.assigned_to)
        .maybeSingle()
    : { data: null };

  const { data: activities } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    ...lead,
    niche: niche ?? null,
    assignee: assignee ?? null,
    niche_intelligence: nicheIntelligence,
    activities: activities ?? [],
  };
}
