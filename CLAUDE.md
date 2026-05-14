# Claude Code — Lead Engine Project Context

This file is automatically loaded by Claude Code at the start of every session. The rules and context below apply to ALL prompts unless explicitly overridden.

---

## Project identity

**Lead Engine** — internal desktop tool for the TwentyFour sales team (Eyad + team).

Purpose: research SMB niches across US/CA/UK/AU, generate enriched cold-call lead lists, surface time-sensitive triggers, provide AI-personalized openers, learn from every call.

**Not public. Not multi-tenant. Internal Electron desktop app for a small team.**

---

## Required reading

Before writing ANY code in this project, you MUST read in full:

1. `PROJECT_SPEC.md` — what to build (912 lines, the source of truth on features, data model, AI prompts, build phases)
2. `BUILD_INSTRUCTIONS.md` — how to build it (folder structure, pinned versions, env vars, auth flow, error handling, the 10 starter prompts)
3. `KNOWN_ISSUES.md` — friction points that WILL occur during the build, each with a documented mitigation strategy. Apply the documented mitigation when you hit one — don't improvise.
4. `PROMPT_LIBRARY.md` — verbatim prompts for Phases 3-5 (continuation of BUILD_INSTRUCTIONS section 12), ending at the v1 cutover point.

These four plus this file (`CLAUDE.md`) and `README.md` make up the six foundation docs. CLAUDE.md is auto-loaded; the others must be read in full at session start.

If any of these conflict with a user instruction, ASK before proceeding. Do not silently override.

---

## Owner profile

- **Name:** Eyad
- **Location:** Cairo, Egypt
- **Role:** Founder of TwentyFour (twentyfour.app), non-coder, uses Cursor and Claude Code as primary coding assistants
- **Aesthetic:** Bold, confident, non-generic design and copy. Rejects clichéd / technically underwhelming work. Strong opinions on quality.
- **Working style:** PM/operator mindset — wants clean specs, exact decisions, no hand-waving

Write code as if Eyad will need to read and reason about it without coding experience. That means:
- Self-explanatory variable names
- Inline comments on any non-obvious logic
- Clear function boundaries
- No clever one-liners

---

## Tech stack (pinned — do not change without explicit ask)

- Next.js 14 App Router + TypeScript strict
- Tailwind v4 (CSS-first config, `@import "tailwindcss"` + `@theme inline`)
- shadcn/ui (neutral base, CSS variables)
- Supabase (Postgres + Auth + RLS + Realtime + Edge Functions)
- Anthropic Claude Haiku 4.5 for ALL AI calls
- Playwright + stealth for scraping
- Cheerio for HTML parsing
- Electron (Phase 10 wrap)
- pnpm as package manager

Reference: `BUILD_INSTRUCTIONS.md` section 1 for exact versions.

---

## Non-negotiable rules

1. **Read PROJECT_SPEC.md and BUILD_INSTRUCTIONS.md before writing code.** Every session.
2. **Never invent features.** If something seems missing or ambiguous, ASK.
3. **Never change pinned package versions** without asking why.
4. **Never create files outside the documented folder structure** without asking.
5. **Always use Haiku 4.5** for AI — never Sonnet, never Opus, never another provider.
6. **Always wrap external API and scrape calls in try/catch.** No exceptions.
7. **Always normalize phone numbers to E.164** before storing (use libphonenumber-js).
8. **Always compute fingerprint** (sha256 of normalized name + phone + postal) before inserting any lead.
9. **Always check blocked_fingerprints table** before inserting any lead. Skip if matched.
10. **Always call Anthropic via Next.js /api/ routes.** Never from client-side (would expose API key).
11. **Never log API keys.** Never log full lead data in error messages — sanitize first.
12. **Never use localStorage or sessionStorage** for app state — use Supabase or React state.
13. **Default mode is cheap mode** (free scrapers). Paid APIs are opt-in toggles per generation job.
14. **Forced outcome logging is non-negotiable.** Never add a "skip" button to the post-call modal. The friction IS the feature.
15. **One commit per completed prompt.** Prefix commits with phase: `[P1]`, `[P3]`, etc.

---

## Architecture principles

- **Server-side only for secrets and scraping.** Anything touching API keys, the Supabase service role, or Playwright runs in `/api/` routes or Edge Functions.
- **Client-side for UI state only.** No direct DB writes from browser components.
- **Realtime via Supabase.** Pipeline, Hot List, and team activity feeds use Supabase realtime subscriptions for live multi-user sync.
- **Optimistic UI for status changes.** Update local state immediately, roll back on error.
- **Cheap-first waterfall enrichment.** Try free sources first, fall back to paid only if user opted in AND free path missed.
- **Source labeling discipline.** Every contact field has a source badge. Never present unverified data as verified.

---

## Stop signals — pause and confirm

Stop and ask before:

- Changing the fingerprint algorithm (would invalidate the entire blocklist)
- Changing anything in `src/lib/dedup/` or `src/lib/compliance/`
- Modifying auth or RLS policies
- Dropping or recreating a table in a migration
- Introducing a new external API/service not in the spec
- Writing a single file over 200 lines (split it)
- Adding a feature that would cost more than $50 in API setup
- Any time PROJECT_SPEC.md and a user instruction conflict

---

## Build phase awareness

Every session, identify which build phase the task belongs to (PROJECT_SPEC section 16). Don't pull future-phase work into current-phase prompts.

Currently scaffolded for: **Phase 1 — Foundation**

Phase order is sacred:
1. Foundation
2. Niche Explorer
3. Lead Generator core
4. Free enrichment waterfall
5. Pipeline + Call Console + Call Logging (the v1 cutover point — calling starts here)
6. Personalized Openers
7. Trigger Events / Hot List
8. Learning Dashboard
9. Blocklist Review + Compliance + Polish
10. Electron Wrap
11. Optional Paid Fallback Layer

---

## File-touch policy

- **Schema changes:** always a new migration file, never edit an old one
- **Type generation:** run `pnpm run generate-types` after every schema change
- **shadcn components:** install on-demand only, never bulk-add
- **AI prompts:** stored in DB (`ai_prompts` table), editable in Settings UI — do NOT hardcode prompts in source after Phase 2

---

## Communication style with the user

- Be direct. Eyad doesn't want fluff or excessive hedging.
- When proposing approaches, give a recommendation with reasoning, not just options.
- Surface trade-offs honestly. If something is risky or expensive, say so.
- Don't apologize for asking clarifying questions on ambiguous spec items — that's correct behavior.
- Show progress in short status updates, not long monologues.
- Don't quote the spec back at the user when they ask a question — answer in your own words and reference the spec section.

---

## Out of scope (do not build in v1)

- Public signup or billing
- Mobile app
- Auto-dialer
- Email sending / sequences
- SMS sending
- CRM integrations (HubSpot, Salesforce)
- X/Twitter scraping
- LinkedIn scraping
- Real-time call transcription
- Proposal/contract generation

If user asks for any of the above, refer to PROJECT_SPEC section 17 and propose adding to a v2 backlog instead.

---

**End of CLAUDE.md.**
