-- §3.13 pricing_config
-- Per-source unit cost for the cost estimator (§6). One row per third-party
-- source; cost_usd is the unit price for that source's unit of work (e.g.
-- "per 1000 results", "per lookup"). Seed rows are loaded by migration 019.

create table public.pricing_config (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  source text unique,
  unit text,
  cost_usd numeric,
  notes text
);
