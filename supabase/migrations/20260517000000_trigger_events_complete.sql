-- P13: trigger_events completion + lead trigger snapshot fields

-- scraper_health: auto-disable flag for Settings → Health
alter table public.scraper_health
  add column if not exists is_disabled boolean default false;

-- trigger_events: action columns + dedupe + critical severity
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trigger_events' and column_name = 'is_acted_on'
  ) then
    alter table public.trigger_events rename column is_acted_on to is_actioned;
  end if;
end $$;

alter table public.trigger_events
  add column if not exists actioned_by uuid references public.team_members(id),
  add column if not exists actioned_at timestamptz,
  add column if not exists dedupe_key text;

alter table public.trigger_events
  drop constraint if exists trigger_events_severity_check;

alter table public.trigger_events
  add constraint trigger_events_severity_check check (
    severity in ('low', 'medium', 'high', 'critical')
  );

create unique index if not exists trigger_events_dedupe_key_unique
  on public.trigger_events (dedupe_key)
  where dedupe_key is not null;

-- Lead fields for detectors
alter table public.leads
  add column if not exists review_count_history jsonb default '[]'::jsonb,
  add column if not exists website_snapshot_hash text,
  add column if not exists website_snapshot_at timestamptz;

alter table public.leads
  alter column country set default 'US';

-- Opener attribution to trigger
alter table public.pitch_opener_variants
  add column if not exists trigger_event_id uuid references public.trigger_events(id);
