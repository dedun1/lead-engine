-- §3.7 call_attempts
-- One row per call attempt. The "required if X" rules (result required if
-- outcome='answered', objection required if result in ('not_interested',
-- 'price_objection_dead')) are enforced in the forced outcome modal
-- (§9.2) — DB check constraints just gate the enum values.
--
-- prospect_local_hour and prospect_local_day are computed from lead.timezone
-- at write time so Learning Dashboard heatmaps don't need timezone math at
-- read time.
--
-- The fk on opener_variant_id is added in migration 121200
-- (pitch_opener_variants creation) to avoid a forward reference.

create table public.call_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  lead_id uuid references public.leads(id),
  actor_id uuid references public.team_members(id),
  called_at timestamptz,
  prospect_local_hour int check (prospect_local_hour between 0 and 23),
  prospect_local_day int check (prospect_local_day between 0 and 6),
  duration_seconds int,
  outcome text check (outcome in ('answered', 'voicemail', 'no_answer', 'busy', 'disconnected', 'wrong_number', 'do_not_call_requested')),
  result text check (result in ('meeting_set', 'interested_callback', 'not_interested', 'decision_maker_unavailable', 'hostile', 'price_objection_dead', 'wrong_decision_maker')),
  objection text check (objection in ('too_expensive', 'already_have_solution', 'no_budget', 'too_busy', 'not_owner', 'dont_trust_ai', 'language_barrier', 'offshore_concern', 'wrong_timing', 'no_interest', 'other')),
  objection_other text,
  notes text,
  opener_variant_id uuid,
  callback_at timestamptz,
  callback_note text
);
