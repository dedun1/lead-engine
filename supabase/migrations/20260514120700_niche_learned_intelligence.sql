-- §3.4 niche_learned_intelligence
-- Performance overlay recomputed nightly from call_attempts. region nullable
-- (null = niche/country aggregate; not null = region-level rollup).
-- The fk on top_pitch_opener_variant_id is added in migration 121200
-- (pitch_opener_variants creation) to avoid a forward reference.

create table public.niche_learned_intelligence (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  niche_id uuid references public.niches(id),
  country text,
  region text,
  total_calls int,
  total_pickups int,
  total_meetings_set int,
  total_customers int,
  pickup_rate numeric,
  meeting_rate numeric,
  close_rate numeric,
  best_call_hour_local int check (best_call_hour_local between 0 and 23),
  best_call_day_local int check (best_call_day_local between 0 and 6),
  top_objections jsonb,
  top_pitch_opener_variant_id uuid,
  avg_call_duration_seconds int,
  pickup_rate_by_review_count_band jsonb,
  pickup_rate_by_rating_band jsonb,
  last_recomputed_at timestamptz
);
