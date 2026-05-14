-- §3.10 lead_activities
-- Append-only audit log of everything that happens to a lead — status
-- changes, enrichment updates, owner assignment, block/unblock, callbacks,
-- etc. payload schema is per-activity_type (free-form jsonb).

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  lead_id uuid references public.leads(id),
  actor_id uuid references public.team_members(id),
  activity_type text,
  payload jsonb
);
