-- §3.3 niche_intelligence
-- One row per (niche, country) pair. AI-generated baseline overlaid with
-- real performance over time (see §3.4 for the learned overlay).
-- generation_source tracks whether values came from Claude's parametric
-- knowledge, web search, or manual admin edit.

create table public.niche_intelligence (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  niche_id uuid references public.niches(id),
  country text,
  summary text,
  automation_demand_score int check (automation_demand_score between 1 and 10),
  cold_call_viability_score int check (cold_call_viability_score between 1 and 10),
  twentyfour_fit_score int check (twentyfour_fit_score between 1 and 10),
  avg_ticket_low numeric,
  avg_ticket_high numeric,
  currency text,
  typical_bookings_per_month_low int,
  typical_bookings_per_month_high int,
  typical_monthly_revenue_low numeric,
  typical_monthly_revenue_high numeric,
  market_fragmentation text check (market_fragmentation in ('high', 'medium', 'low')),
  phone_dependency text check (phone_dependency in ('high', 'medium', 'low')),
  existing_automation_adoption text check (existing_automation_adoption in ('low', 'medium', 'high')),
  best_regions text[],
  pain_points text[],
  twentyfour_pitch_angles text[],
  typical_owner_persona text,
  generation_source text check (generation_source in ('claude_knowledge', 'claude_web_search', 'manual_edit')),
  generated_at timestamptz,
  edited_by uuid references public.team_members(id),
  last_refreshed_at timestamptz,
  unique (niche_id, country)
);
