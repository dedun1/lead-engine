-- Indexes from PROJECT_SPEC §3.5 (the only section that explicitly lists
-- secondary indexes — other tables rely on their unique constraints' implicit
-- indexes for now).
--
-- The unique index on leads.fingerprint is implicit from the column-level
-- UNIQUE constraint (created in migration 20260514120800), so we do NOT
-- recreate it here — that would error with "relation already exists".

-- Pipeline filtering: niche → country → region → city → status drives the
-- Lead Pipeline view (§10.2). Compound index keeps "leads for niche X in
-- Houston with status=queued" fast as the table grows.
create index leads_pipeline_filter_idx
  on public.leads (niche_id, country, region, city, status);

-- Fast filter to exclude blocked leads from every pipeline view.
create index leads_is_blocked_idx
  on public.leads (is_blocked);

-- "Leads assigned to me" + "my queue" lookups in Call Queue and Pipeline.
create index leads_assigned_to_status_idx
  on public.leads (assigned_to, status);
