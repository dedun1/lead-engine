-- §3.2 niches
-- Industry taxonomy. NAICS-anchored for US/CA, with text-only fallbacks for
-- UK/AU niches that don't map to NAICS (naics_code is nullable). is_shortlist
-- marks the curated subset of ~150 high-fit niches; is_actively_pitching
-- scopes trigger monitoring and opener generation (see §7.1 and §8.1).
-- weather_sensitive drives storm-trigger eligibility (roofing, HVAC, etc.).

create table public.niches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  naics_code text,
  name text not null,
  country_scope text[],
  is_shortlist boolean default false,
  is_favorited boolean default false,
  is_actively_pitching boolean default false,
  parent_sector text,
  weather_sensitive boolean default false
);
