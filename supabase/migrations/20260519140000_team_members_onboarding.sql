alter table public.team_members
  add column if not exists completed_onboarding boolean not null default false,
  add column if not exists anthropic_key_deferred boolean not null default false;
