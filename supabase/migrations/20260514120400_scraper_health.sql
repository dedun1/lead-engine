-- §3.14 scraper_health
-- Per-source health tracking. health_check() runs daily via cron (§19a);
-- 3 consecutive failures auto-disable the source and trigger paid fallback
-- if configured. Settings → Source Health panel reads this table.

create table public.scraper_health (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  source text,
  status text check (status in ('healthy', 'degraded', 'down')),
  last_check_at timestamptz,
  last_error text,
  consecutive_failures int
);
