-- P23: unified activity feed (UNION ALL with per-branch LIMIT)

create or replace function public.get_activity_feed(
  p_start timestamptz,
  p_end timestamptz,
  p_user_ids uuid[] default null,
  p_include_calls boolean default true,
  p_activity_types text[] default null,
  p_include_generation boolean default true,
  p_include_triggers boolean default true,
  p_lead_search text default null,
  p_niche_id uuid default null,
  p_cursor timestamptz default null,
  p_limit int default 50
)
returns table (
  kind text,
  occurred_at timestamptz,
  user_id uuid,
  lead_id uuid,
  payload jsonb,
  source_id uuid,
  business_name text,
  city text,
  region text,
  niche_name text,
  actor_name text
)
language sql
stable
security invoker
set search_path = public
as $$
  with
  calls as (
    select
      'call'::text as kind,
      ca.called_at as occurred_at,
      ca.actor_id as user_id,
      ca.lead_id,
      jsonb_build_object(
        'outcome', ca.outcome,
        'sub_outcome', ca.sub_outcome,
        'notes', ca.notes,
        'tags', ca.tags,
        'sentiment_score', ca.sentiment_score,
        'duration_seconds', ca.duration_seconds
      ) as payload,
      ca.id as source_id
    from call_attempts ca
    inner join leads l on l.id = ca.lead_id
    where p_include_calls
      and ca.called_at is not null
      and ca.called_at >= p_start
      and ca.called_at <= p_end
      and (p_cursor is null or ca.called_at < p_cursor)
      and (p_user_ids is null or ca.actor_id = any(p_user_ids))
      and (p_niche_id is null or l.niche_id = p_niche_id)
      and (
        p_lead_search is null
        or l.business_name ilike '%' || p_lead_search || '%'
      )
    order by ca.called_at desc
    limit p_limit
  ),
  activities as (
    select
      la.activity_type as kind,
      la.created_at as occurred_at,
      la.actor_id as user_id,
      la.lead_id,
      coalesce(la.payload, '{}'::jsonb) as payload,
      la.id as source_id
    from lead_activities la
    inner join leads l on l.id = la.lead_id
    where p_activity_types is not null
      and la.created_at >= p_start
      and la.created_at <= p_end
      and (p_cursor is null or la.created_at < p_cursor)
      and (p_user_ids is null or la.actor_id = any(p_user_ids))
      and (p_niche_id is null or l.niche_id = p_niche_id)
      and (
        p_lead_search is null
        or l.business_name ilike '%' || p_lead_search || '%'
      )
      and la.activity_type = any(p_activity_types)
    order by la.created_at desc
    limit p_limit
  ),
  generations as (
    select
      'generation'::text as kind,
      coalesce(gj.completed_at, gj.started_at, gj.created_at) as occurred_at,
      gj.started_by as user_id,
      null::uuid as lead_id,
      jsonb_build_object(
        'city', gj.city,
        'region', gj.region,
        'country', gj.country,
        'delivered_count', gj.delivered_count,
        'requested_count', gj.requested_count,
        'status', gj.status,
        'started_at', gj.started_at,
        'completed_at', gj.completed_at,
        'niche_name', n.name
      ) as payload,
      gj.id as source_id
    from generation_jobs gj
    left join niches n on n.id = gj.niche_id
    where p_include_generation
      and coalesce(gj.completed_at, gj.started_at, gj.created_at) >= p_start
      and coalesce(gj.completed_at, gj.started_at, gj.created_at) <= p_end
      and (
        p_cursor is null
        or coalesce(gj.completed_at, gj.started_at, gj.created_at) < p_cursor
      )
      and (p_user_ids is null or gj.started_by = any(p_user_ids))
      and (p_niche_id is null or gj.niche_id = p_niche_id)
      and (
        p_lead_search is null
        or gj.city ilike '%' || p_lead_search || '%'
        or n.name ilike '%' || p_lead_search || '%'
      )
    order by coalesce(gj.completed_at, gj.started_at, gj.created_at) desc
    limit p_limit
  ),
  triggers as (
    select
      'trigger'::text as kind,
      te.detected_at as occurred_at,
      null::uuid as user_id,
      te.lead_id,
      jsonb_build_object(
        'trigger_type', te.trigger_type,
        'severity', te.severity,
        'details', te.details
      ) as payload,
      te.id as source_id
    from trigger_events te
    inner join leads l on l.id = te.lead_id
    where p_include_triggers
      and te.detected_at is not null
      and te.detected_at >= p_start
      and te.detected_at <= p_end
      and (p_cursor is null or te.detected_at < p_cursor)
      and (p_niche_id is null or l.niche_id = p_niche_id)
      and (
        p_lead_search is null
        or l.business_name ilike '%' || p_lead_search || '%'
      )
    order by te.detected_at desc
    limit p_limit
  ),
  merged as (
    select * from calls
    union all
    select * from activities
    union all
    select * from generations
    union all
    select * from triggers
  ),
  ranked as (
    select * from merged
    order by occurred_at desc
    limit p_limit
  )
  select
    r.kind,
    r.occurred_at,
    r.user_id,
    r.lead_id,
    r.payload,
    r.source_id,
    l.business_name,
    l.city,
    l.region,
    coalesce(n.name, r.payload->>'niche_name') as niche_name,
    case
      when r.kind = 'trigger' then 'System'
      else coalesce(tm.display_name, tm.email, 'Unknown')
    end as actor_name
  from ranked r
  left join leads l on l.id = r.lead_id
  left join niches n on n.id = l.niche_id
  left join team_members tm on tm.id = r.user_id
  order by r.occurred_at desc;
$$;

grant execute on function public.get_activity_feed(
  timestamptz,
  timestamptz,
  uuid[],
  boolean,
  text[],
  boolean,
  boolean,
  text,
  uuid,
  timestamptz,
  int
) to authenticated;
