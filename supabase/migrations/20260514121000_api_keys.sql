-- §3.12 api_keys
-- Encrypted-at-rest storage for third-party API keys. Schema inferred from
-- BUILD_INSTRUCTIONS Prompt 7 — §3.12 only specifies "Encrypted at rest.
-- Admin-only." Free-form service column so adding a new paid source never
-- requires a schema migration. encrypted_value is AES-256-GCM ciphertext
-- (base64 of iv|auth_tag|ciphertext) using ENCRYPTION_SECRET from env.
-- last_four is the plaintext last 4 chars, shown in UI for identification.

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  service text unique,
  encrypted_value text,
  last_four text,
  updated_by uuid references public.team_members(id)
);
