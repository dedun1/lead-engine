-- Init extensions: foundational Postgres features used across the schema.
--
-- pgcrypto:   gen_random_uuid() for primary keys + digest()/sha256 for lead
--             fingerprints (see PROJECT_SPEC section 5.1 — sha256 of normalized
--             name + phone + postal).
-- citext:     case-insensitive text columns (email lookups, business-name matches).
-- uuid-ossp:  alternative UUID generators (uuid_generate_v4) — kept for any
--             tool / library that expects this extension by name.

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists "uuid-ossp";
