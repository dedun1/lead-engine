-- Enable RLS on every table and create one permissive "authenticated all"
-- policy per table.
--
-- Per BUILD_INSTRUCTIONS §4 and CLAUDE.md: "start permissive (any
-- authenticated user can read/write everything), tighten later if needed.
-- For this team-of-N internal tool, the perimeter is auth itself, not
-- row-level."
--
-- Fine-grained per-row policies (admin-only writes to api_keys, owner-only
-- reads of personal call notes, etc.) come later if and when the threat
-- model widens. For now: authenticated = full access.

-- team_members
alter table public.team_members enable row level security;
create policy "team_members_authenticated_all"
  on public.team_members for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- niches
alter table public.niches enable row level security;
create policy "niches_authenticated_all"
  on public.niches for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- niche_intelligence
alter table public.niche_intelligence enable row level security;
create policy "niche_intelligence_authenticated_all"
  on public.niche_intelligence for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- niche_learned_intelligence
alter table public.niche_learned_intelligence enable row level security;
create policy "niche_learned_intelligence_authenticated_all"
  on public.niche_learned_intelligence for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- leads
alter table public.leads enable row level security;
create policy "leads_authenticated_all"
  on public.leads for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- blocked_fingerprints
alter table public.blocked_fingerprints enable row level security;
create policy "blocked_fingerprints_authenticated_all"
  on public.blocked_fingerprints for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- call_attempts
alter table public.call_attempts enable row level security;
create policy "call_attempts_authenticated_all"
  on public.call_attempts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- pitch_opener_variants
alter table public.pitch_opener_variants enable row level security;
create policy "pitch_opener_variants_authenticated_all"
  on public.pitch_opener_variants for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- trigger_events
alter table public.trigger_events enable row level security;
create policy "trigger_events_authenticated_all"
  on public.trigger_events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- lead_activities
alter table public.lead_activities enable row level security;
create policy "lead_activities_authenticated_all"
  on public.lead_activities for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- generation_jobs
alter table public.generation_jobs enable row level security;
create policy "generation_jobs_authenticated_all"
  on public.generation_jobs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- api_keys
alter table public.api_keys enable row level security;
create policy "api_keys_authenticated_all"
  on public.api_keys for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- pricing_config
alter table public.pricing_config enable row level security;
create policy "pricing_config_authenticated_all"
  on public.pricing_config for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- scraper_health
alter table public.scraper_health enable row level security;
create policy "scraper_health_authenticated_all"
  on public.scraper_health for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- weekly_insights
alter table public.weekly_insights enable row level security;
create policy "weekly_insights_authenticated_all"
  on public.weekly_insights for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
