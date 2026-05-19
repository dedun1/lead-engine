-- SQL-level dashboard aggregations (GROUP BY) — avoid loading all rows into JS.

create or replace function public.dashboard_lead_counts_by_niche()
returns table (niche_id uuid, total bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select niche_id, count(*)::bigint
  from public.leads
  where niche_id is not null
  group by niche_id;
$$;

create or replace function public.dashboard_niche_call_stats(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  niche_id uuid,
  calls bigint,
  answered bigint,
  interested bigint,
  meetings bigint,
  sentiment_sum double precision,
  sentiment_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    l.niche_id,
    count(*)::bigint as calls,
    count(*) filter (where ca.outcome = 'answered')::bigint as answered,
    count(*) filter (
      where ca.outcome = 'answered'
        and ca.sub_outcome in ('interested', 'follow_up_requested', 'booked_meeting')
    )::bigint as interested,
    count(*) filter (where ca.sub_outcome = 'booked_meeting')::bigint as meetings,
    coalesce(sum(ca.sentiment_score), 0)::double precision as sentiment_sum,
    count(ca.sentiment_score)::bigint as sentiment_count
  from public.call_attempts ca
  inner join public.leads l on l.id = ca.lead_id
  where ca.called_at >= p_start
    and ca.called_at <= p_end
    and l.niche_id is not null
  group by l.niche_id;
$$;

create or replace function public.dashboard_generation_cost_by_niche(
  p_start timestamptz,
  p_end timestamptz
)
returns table (niche_id uuid, total_cost numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select niche_id, coalesce(sum(actual_cost_usd), 0)::numeric
  from public.generation_jobs
  where created_at >= p_start
    and created_at <= p_end
    and niche_id is not null
  group by niche_id;
$$;

create or replace function public.dashboard_opener_call_stats(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  opener_variant_id uuid,
  used bigint,
  answered bigint,
  interested bigint,
  meetings bigint,
  last_called_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    opener_variant_id,
    count(*)::bigint as used,
    count(*) filter (where outcome = 'answered')::bigint as answered,
    count(*) filter (
      where outcome = 'answered'
        and sub_outcome in ('interested', 'follow_up_requested', 'booked_meeting')
    )::bigint as interested,
    count(*) filter (where sub_outcome = 'booked_meeting')::bigint as meetings,
    max(called_at) as last_called_at
  from public.call_attempts
  where called_at >= p_start
    and called_at <= p_end
    and opener_variant_id is not null
  group by opener_variant_id;
$$;

grant execute on function public.dashboard_lead_counts_by_niche() to authenticated;
grant execute on function public.dashboard_niche_call_stats(timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_generation_cost_by_niche(timestamptz, timestamptz) to authenticated;
grant execute on function public.dashboard_opener_call_stats(timestamptz, timestamptz) to authenticated;
