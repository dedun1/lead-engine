-- §3.11 generation_jobs
-- One row per Lead Generator run. Tracks cost (estimated vs actual), counts
-- (delivered, dedup-skipped, blocklist-skipped), status, filters used.
-- Powers the Generation History page (§12 sidebar) and the cost-variance
-- pause logic from §6 + KNOWN_ISSUES 10j.

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  niche_id uuid references public.niches(id),
  country text,
  region text,
  city text,
  postal_code text,
  requested_count int,
  delivered_count int,
  filters jsonb,
  estimated_cost_usd numeric,
  actual_cost_usd numeric,
  cost_breakdown jsonb,
  started_by uuid references public.team_members(id),
  started_at timestamptz,
  completed_at timestamptz,
  status text check (status in ('estimating', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  error_log text,
  dedup_skip_count int default 0,
  blocklist_skip_count int default 0
);
