-- P21: structured weekly insight fields for Learning Dashboard

alter table public.weekly_insights
  add column if not exists headline_observation text,
  add column if not exists actionable_insights jsonb,
  add column if not exists experiments_to_try jsonb,
  add column if not exists generated_at timestamptz,
  add column if not exists generated_by text,
  add column if not exists source_metrics jsonb;

create unique index if not exists weekly_insights_week_starting_key
  on public.weekly_insights (week_starting)
  where week_starting is not null;
