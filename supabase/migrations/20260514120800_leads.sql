-- §3.5 leads
-- Main lead table. fingerprint is the dedup gatekeeper (sha256 of normalized
-- name + phone + postal — see §5.1); unique constraint creates the implicit
-- unique index referenced in §3.5. Soft-delete via is_blocked preserves
-- audit trail; the row stays but disappears from pipeline views.
--
-- has_website is a generated column populated from website — lets queries
-- filter "websited vs not" without recomputing on every read.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  niche_id uuid references public.niches(id),
  country text,
  region text,
  city text,
  postal_code text,
  business_name text not null,
  address text,
  latitude numeric,
  longitude numeric,
  business_phone text,
  business_phone_label text,
  owner_name text,
  owner_phone text,
  owner_phone_source text,
  owner_phone_confidence text,
  owner_email text,
  owner_email_source text,
  additional_contacts jsonb,
  website text,
  has_website boolean generated always as (website is not null) stored,
  socials jsonb,
  google_rating numeric,
  google_review_count int,
  yelp_rating numeric,
  yelp_review_count int,
  bbb_rating text,
  bbb_accredited boolean,
  employee_count_estimate int,
  employee_count_source text,
  annual_revenue_estimate numeric,
  business_hours jsonb,
  timezone text,
  ai_summary text,
  source_log jsonb,
  fingerprint text unique not null,
  status text check (status in ('new', 'queued', 'contacted', 'meeting_set', 'customer', 'dead', 'dnc')) default 'new',
  assigned_to uuid references public.team_members(id),
  last_called_at timestamptz,
  times_called int default 0,
  seen_again_count int default 0,
  is_blocked boolean default false,
  blocked_at timestamptz,
  blocked_by uuid references public.team_members(id),
  blocked_reason text
);
