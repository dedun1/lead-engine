-- P11: enrichment waterfall fields on leads

alter table public.leads
  add column if not exists owner_email_status text,
  add column if not exists owner_linkedin_url text,
  add column if not exists business_registration jsonb,
  add column if not exists enriched_at timestamptz;

alter table public.leads
  drop constraint if exists leads_owner_email_status_check;

alter table public.leads
  add constraint leads_owner_email_status_check check (
    owner_email_status is null or owner_email_status in (
      'verified', 'risky', 'invalid', 'unverified'
    )
  );
