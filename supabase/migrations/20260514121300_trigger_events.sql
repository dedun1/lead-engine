-- §3.9 trigger_events
-- Time-sensitive intent signals (storms, review spikes, etc.) driving the
-- Hot List (§7). Each row is one detected event; expires_at lets the daily
-- cron (§7.2) auto-hide stale ones. details is a per-trigger_type jsonb
-- payload (e.g. storm: { event, severity, effective, expires, description }).

create table public.trigger_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  lead_id uuid references public.leads(id),
  trigger_type text check (trigger_type in ('review_velocity_spike', 'recent_negative_review', 'storm_in_area', 'new_business_registration', 'website_change', 'facebook_resurrection', 'google_traffic_spike')),
  detected_at timestamptz,
  details jsonb,
  severity text check (severity in ('low', 'medium', 'high')),
  is_acted_on boolean default false,
  expires_at timestamptz
);
