-- §3.6 blocked_fingerprints
-- Permanent regeneration prevention. Every lead lookup checks here before
-- insert (see §5.2 step 2). Monthly review panel (Settings → Blocklist
-- Review) bulk-unblocks stale entries; last_reviewed_at tracks review cadence.

create table public.blocked_fingerprints (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  fingerprint text unique not null,
  business_name text,
  business_phone text,
  city text,
  region text,
  country text,
  reason text,
  blocked_by uuid references public.team_members(id),
  blocked_at timestamptz,
  last_reviewed_at timestamptz
);
