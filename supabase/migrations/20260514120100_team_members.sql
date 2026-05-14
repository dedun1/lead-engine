-- §3.1 team_members
-- Invite-only team accounts (admin or member). Auth identity comes from
-- Supabase Auth; this row holds the app-side profile and role.

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  email text unique not null,
  display_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  is_active boolean default true
);
