-- §3.8 pitch_opener_variants
-- Library of opener variants. Niche-level (lead_id null, niche_id not null)
-- baseline templates, per-lead personalized (lead_id not null,
-- is_personalized true), or global (both nullable). conversion_rate is a
-- generated column auto-recomputed when times_used or meetings_set changes.
--
-- Tail of file: ALTER TABLE statements that add the deferred foreign keys
-- from niche_learned_intelligence and call_attempts now that this table
-- exists.

create table public.pitch_opener_variants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  niche_id uuid references public.niches(id),
  lead_id uuid references public.leads(id),
  country text,
  name text,
  opener_text text not null,
  is_active boolean default true,
  is_personalized boolean default false,
  created_by_id uuid references public.team_members(id),
  times_used int default 0,
  meetings_set int default 0,
  conversion_rate numeric generated always as (case when times_used > 0 then meetings_set::numeric / times_used else 0 end) stored
);

-- Deferred fks from earlier migrations.
alter table public.niche_learned_intelligence
  add constraint niche_learned_intelligence_top_pitch_opener_variant_id_fkey
  foreign key (top_pitch_opener_variant_id) references public.pitch_opener_variants(id);

alter table public.call_attempts
  add constraint call_attempts_opener_variant_id_fkey
  foreign key (opener_variant_id) references public.pitch_opener_variants(id);
