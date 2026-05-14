# Build Instructions — Lead Engine

Companion to `PROJECT_SPEC.md`. The spec defines **what** to build; this defines **how to build it smoothly**. Read both before starting.

---

## 1. Tech Stack (Pinned)

Lock these versions. If Claude Code wants newer, refuse — pin the spec, upgrade later as a deliberate task.

### Frontend / app
```
next                14.2.x
react               18.3.x
react-dom           18.3.x
typescript          5.4.x
tailwindcss         4.0.x      // Tailwind v4 — @import "tailwindcss" + @theme inline
@radix-ui/*         latest      // shadcn/ui dependencies
class-variance-authority  latest
tailwind-merge      latest
lucide-react        latest
sonner              latest
next-themes         latest
react-hook-form     7.x
zod                 3.x
@tanstack/react-table  8.x
recharts            2.x
luxon               3.x
libphonenumber-js   1.x
```

### Backend / data
```
@supabase/supabase-js          2.x
@supabase/ssr                  latest
@anthropic-ai/sdk              latest
```

### Scraping & enrichment
```
playwright                     1.4x
playwright-extra               latest
puppeteer-extra-plugin-stealth latest      // works with playwright-extra
cheerio                        1.x
node-fetch                     3.x
email-existence                latest      // free SMTP verify
crypto                         (built-in)  // for sha256 fingerprints
```

### Electron wrap
```
electron                       30.x
electron-builder               25.x
electron-updater               6.x
```

### Dev tooling
```
eslint                         8.x
prettier                       3.x
tsx                            4.x         // run TS scripts directly
dotenv                         16.x
```

**Supabase CLI** (separate install, NOT a package dep — kept off the project
manifest because the Supabase team explicitly blocks global npm installs):

- **Windows:** `scoop install supabase` (install [Scoop](https://scoop.sh) first if needed)
- **macOS:** `brew install supabase/tap/supabase`
- **Linux:** download the binary from <https://github.com/supabase/cli/releases>

Do NOT use `npm install -g supabase` — Supabase's postinstall script throws on
global installs intentionally. This is a known Supabase policy, not a workaround.

Verify with `supabase --version`.

### Required peer deps

Not features — build-time / peer / ambient-type deps that the pinned stack
above cannot compile or lint without. List them in `devDependencies` so
future sessions don't re-flag them as "extra".

```
@types/node                    20.x         // ambient Node types
@types/react                   18.x         // ambient React types
@types/react-dom               18.x         // ambient ReactDOM types
@types/luxon                   3.x          // ambient Luxon types
eslint-config-next             14.2.x       // required for `next lint`
postcss                        8.x          // Tailwind v4 build pipeline
@tailwindcss/postcss           4.0.x        // Tailwind v4 PostCSS plugin
```

**Package manager:** pnpm (faster than npm, better with monorepos if we ever split). Install with `npm install -g pnpm`.

---

## 2. Folder Structure

```
lead-engine/
├── PROJECT_SPEC.md              ← the foundation spec
├── BUILD_INSTRUCTIONS.md        ← this file
├── CLAUDE.md                    ← Claude Code's persistent context (see §10)
├── README.md                    ← team-facing setup instructions
├── .env.local.example           ← env template (commit this)
├── .env.local                   ← actual env (gitignored)
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.js
├── postcss.config.mjs           ← Tailwind v4 PostCSS plugin
├── electron/                    ← Electron wrapper code (Phase 10)
│   ├── main.ts
│   ├── preload.ts
│   └── updater.ts
├── electron-builder.yml         ← installer config
├── public/
│   ├── icon.png
│   └── splash.png
├── src/
│   ├── app/                     ← Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx             ← redirects to default landing
│   │   ├── globals.css          ← Tailwind v4 + @theme inline
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── (app)/               ← authenticated routes
│   │   │   ├── layout.tsx       ← sidebar shell
│   │   │   ├── hot-list/
│   │   │   ├── call-queue/
│   │   │   ├── pipeline/
│   │   │   ├── generator/
│   │   │   ├── niches/
│   │   │   ├── dashboard/
│   │   │   ├── history/
│   │   │   ├── team/
│   │   │   └── settings/
│   │   │       ├── api-keys/
│   │   │       ├── pricing/
│   │   │       ├── health/
│   │   │       ├── blocklist/
│   │   │       └── prompts/
│   │   └── api/                 ← Next.js API routes
│   │       ├── generate/route.ts
│   │       ├── enrich/route.ts
│   │       ├── triggers/scan/route.ts
│   │       ├── ai/niche-card/route.ts
│   │       ├── ai/opener/route.ts
│   │       ├── ai/summary/route.ts
│   │       └── ai/weekly-insights/route.ts
│   ├── components/
│   │   ├── ui/                  ← shadcn primitives
│   │   ├── shell/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── niche/
│   │   ├── lead/
│   │   ├── call-console/
│   │   ├── trigger/
│   │   └── dashboard/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        ← browser client
│   │   │   ├── server.ts        ← server client (SSR)
│   │   │   └── admin.ts         ← service-role client
│   │   ├── ai/
│   │   │   ├── anthropic.ts     ← Haiku 4.5 client
│   │   │   ├── prompts.ts       ← prompt templates
│   │   │   └── parse-json.ts    ← strip ```json fences, safe parse
│   │   ├── scrape/
│   │   │   ├── google-maps.ts
│   │   │   ├── website.ts       ← Cheerio-based
│   │   │   ├── duckduckgo.ts
│   │   │   ├── companies-house.ts
│   │   │   ├── sos-texas.ts
│   │   │   ├── sos-florida.ts
│   │   │   ├── sos-california.ts
│   │   │   ├── sos-new-york.ts
│   │   │   ├── facebook.ts
│   │   │   ├── instagram.ts
│   │   │   ├── yelp.ts
│   │   │   └── bbb.ts
│   │   ├── enrich/
│   │   │   ├── waterfall.ts     ← orchestrator
│   │   │   ├── owner-name.ts
│   │   │   ├── owner-email.ts
│   │   │   ├── owner-phone.ts
│   │   │   └── employee-count.ts
│   │   ├── triggers/
│   │   │   ├── review-velocity.ts
│   │   │   ├── negative-review.ts
│   │   │   ├── storm.ts          ← NOAA API
│   │   │   ├── new-business.ts
│   │   │   ├── website-change.ts
│   │   │   ├── facebook-resurrection.ts
│   │   │   └── google-traffic.ts
│   │   ├── dedup/
│   │   │   ├── fingerprint.ts
│   │   │   └── blocklist.ts
│   │   ├── compliance/
│   │   │   ├── dnc-us.ts
│   │   │   ├── ctps-uk.ts
│   │   │   └── dncr-au.ts
│   │   ├── cost/
│   │   │   ├── estimator.ts
│   │   │   └── tracker.ts
│   │   ├── phone.ts             ← libphonenumber-js helpers
│   │   ├── timezone.ts          ← luxon helpers
│   │   └── crypto.ts            ← sha256 + AES encryption for api_keys
│   ├── hooks/
│   │   ├── use-supabase.ts
│   │   ├── use-leads.ts
│   │   ├── use-realtime.ts
│   │   └── use-toast.ts
│   ├── types/
│   │   ├── database.types.ts    ← generated from Supabase
│   │   ├── lead.ts
│   │   ├── niche.ts
│   │   ├── trigger.ts
│   │   └── call.ts
│   └── styles/
│       └── tokens.css           ← Tailwind v4 @theme tokens
├── supabase/
│   ├── migrations/              ← one file per migration, timestamped
│   │   ├── 20260514120000_init.sql
│   │   ├── 20260514120100_seed_naics.sql
│   │   └── ...
│   ├── functions/               ← Edge Functions
│   │   ├── trigger-scan/
│   │   ├── dnc-scrub/
│   │   ├── learned-intelligence-recompute/
│   │   └── weekly-insights/
│   └── seed/
│       ├── naics_codes.csv      ← 1057 niches
│       └── shortlist.csv        ← ~150 high-fit niches
├── scripts/
│   ├── seed-niches.ts           ← imports NAICS CSV
│   ├── seed-shortlist.ts
│   ├── seed-dev-leads.ts        ← creates fake leads for dev (no API cost)
│   ├── generate-types.ts        ← regenerate database.types.ts from Supabase
│   └── pricing-config-init.ts   ← seed pricing_config table
└── tests/
    └── (defer to v2 — manual QA via Playwright for now)
```

> **Rule:** Claude Code never creates files outside this structure without asking. New directories require justification.

---

## 3. Environment Variables

Create `.env.local.example` (committed) and `.env.local` (gitignored). Template:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic Claude API
ANTHROPIC_API_KEY=

# Optional paid APIs (encrypted in api_keys table in production — env only for dev)
GOOGLE_PLACES_API_KEY=
APOLLO_API_KEY=
HUNTER_API_KEY=
SERPAPI_KEY=
APIFY_TOKEN=
LUSHA_API_KEY=

# Free APIs (no key needed but referenced)
COMPANIES_HOUSE_API_KEY=         # UK — free but requires registration
NOAA_API_KEY=                    # weather — free, requires registration

# Crypto secret for encrypting api_keys table
ENCRYPTION_SECRET=               # 32-byte random string, generate with: openssl rand -hex 32

# Electron (Phase 10)
GH_TOKEN=                        # GitHub personal access token for releases
```

**Rule:** In production, paid API keys live encrypted in `api_keys` table (admin Settings UI). `.env.local` is dev-only convenience. The `ENCRYPTION_SECRET` is the one secret that MUST stay in env even in production.

---

## 4. Auth Flow

**Invite-only.** Public signup is disabled.

- Eyad creates Supabase project, runs migrations, sets up first admin user manually via Supabase dashboard
- That admin invites others via Settings → Team → "Invite member" (sends Supabase magic link)
- New members click link, set display name, role assigned by inviter
- No password — magic link only (simpler + safer for small team)
- Session persists for 30 days via Supabase cookies
- All routes under `/(app)/` require auth; middleware in `src/middleware.ts` redirects to `/login` if no session

**RLS policies:** start permissive (any authenticated user can read/write everything), tighten later if needed. For this team-of-N internal tool, the perimeter is auth itself, not row-level.

---

## 5. Supabase Migration Strategy

**One migration file per logical change.** Don't batch unrelated changes.

**Naming:** `YYYYMMDDHHMMSS_description.sql` — a single 14-digit timestamp
followed by an underscore and a description. **No underscore inside the
timestamp.** The Supabase CLI parses the leading digits up to the first
underscore as the migration version; any `YYYYMMDD_NNN_...` variant collapses
to the 8-digit date and collides the moment a second migration is created
the same day.

Space migrations by 60 seconds (the HHMMSS portion) so they sort in order
without colliding. Easiest way: `supabase migration new <name>` — the CLI
auto-generates the correct 14-digit timestamp.

**Recovery if you accidentally push the legacy `_NNN_` format:** drop any
half-applied tables, delete the orphan row from
`supabase_migrations.schema_migrations` (use `delete from ... where name = '<table>'`)
via the dashboard SQL Editor, rename the file to the 14-digit format,
and re-run `supabase db push`.

**Example sequence — Phase 1 + 4 (the actual files in `supabase/migrations/`):**

```
20260514120000_init_extensions.sql          ← pgcrypto, citext, uuid-ossp
20260514120100_team_members.sql             ← table per file from here on
20260514120200_niches.sql
20260514120300_pricing_config.sql
20260514120400_scraper_health.sql
20260514120500_weekly_insights.sql
20260514120600_niche_intelligence.sql
20260514120700_niche_learned_intelligence.sql
20260514120800_leads.sql
20260514120900_blocked_fingerprints.sql
20260514121000_api_keys.sql
20260514121100_call_attempts.sql
20260514121200_pitch_opener_variants.sql
20260514121300_trigger_events.sql
20260514121400_lead_activities.sql
20260514121500_generation_jobs.sql
20260514121600_indexes.sql
20260514121700_rls_policies.sql
20260514121800_seed_pricing_config.sql
```

Run with Supabase CLI: `supabase db push`. Generate TS types after every schema change: `pnpm run generate-types`.

---

## 6. First-Run / Empty State Behavior

When the app boots for the very first time:

1. Login screen → first admin signs in
2. Settings → API Keys: form is empty, big banner "Add your API keys to start generating leads. At minimum: Anthropic. Other keys optional."
3. Settings → Team: only the admin is present, prompt to invite teammates
4. Niche Explorer: empty grid with CTA "Seed 1057 NAICS niches now" button → runs `scripts/seed-niches.ts`
5. Lead Generator: disabled with message "Add an Anthropic API key first, then favorite or mark a niche as actively pitching"
6. Hot List: empty with message "No active triggers yet. Triggers appear after you generate leads and mark a niche as actively pitching."
7. Pipeline: empty table with CTA "Generate your first leads"
8. Learning Dashboard: empty with message "Insights appear after 50+ calls logged"

Every empty state has a clear next action. Never leave the user staring at a blank screen wondering what to do.

---

## 7. Error Handling Conventions

### Toast levels (sonner)
- `success` — "Generated 200 leads in 11 minutes"
- `info` — "Saved to blocklist. 47 entries to review this month."
- `warning` — "Scraper degraded — falling back to Apify ($1.20 added to estimate)"
- `error` — "Generation failed: Google Maps blocked. Auto-disabled, paid fallback unavailable."

### Error capture rules
- Every async function in `lib/` wrapped in try/catch
- Errors logged to console (dev) + `scraper_health` (scrapers) + `lead_activities` (lead operations)
- User-facing errors: human-readable, never raw stack traces
- API route errors: return `{ error: string, code: string }` with appropriate HTTP status
- Critical errors (auth failure, DB connection): redirect to `/error?code=...`

### Generation job failure handling
- One source failure ≠ job failure. Log to `scraper_health`, continue with next source.
- 3 consecutive source failures → auto-disable, fall back to paid alternative if user opted in
- DB write failure ≠ silently lose data. Retry 3x with exponential backoff, then log to `generation_jobs.error_log`
- Mid-job pause: user can resume from last successful lead

---

## 8. Seed Data Strategy (Save Money During Dev)

**Problem:** developing the UI by repeatedly scraping Google Maps burns quota and time.

**Solution:** `scripts/seed-dev-leads.ts` creates 500 fake-but-realistic leads in dev DB:
- Real business names from a known-public dataset (e.g. OpenStreetMap business POIs)
- Real US/CA/UK/AU addresses
- Fake phone numbers in correct format
- Fake reviews / ratings spread across realistic distributions
- Fake owner names, emails, employee counts
- 50 of them flagged with one of each trigger type for Hot List testing

Run once per environment:
```
pnpm run seed:niches      # Imports 1057 NAICS niches
pnpm run seed:shortlist   # Marks ~150 as is_shortlist=true
pnpm run seed:dev-leads   # 500 fake leads spread across niches (dev only)
pnpm run seed:pricing     # Initial pricing_config rows
```

Production: only `seed:niches`, `seed:shortlist`, `seed:pricing` run. Never `seed:dev-leads`.

---

## 9. Git Workflow

- Private GitHub repo, single `main` branch (no branching ceremony for a team this size)
- Commits prefixed by phase: `[P1]`, `[P2]`, ... `[P11]`
- Examples:
  - `[P1] init Next.js + Tailwind v4 + shadcn`
  - `[P3] google-maps scraper with Playwright stealth`
  - `[P5] forced outcome logging modal`
- One commit per logical change. Don't batch "fixed everything" commits.
- Push to GitHub every working session (Electron auto-updater depends on Releases)

`.gitignore` essentials:
```
node_modules/
.next/
out/
dist/
.env.local
.env*.local
*.log
.DS_Store
playwright/.cache/
electron-builder.cache/
```

---

## 10. CLAUDE.md — Persistent Project Context

Claude Code reads `CLAUDE.md` automatically every session if it exists at the project root. This file is where you put the rules Claude Code must follow on every prompt without you having to repeat them. **See the separate `CLAUDE.md` file in the starter kit.**

---

## 11. Tailwind v4 Setup (Specific to TwentyFour Pattern)

No `tailwind.config.ts` config object. Tailwind v4 uses CSS-first config.

`src/app/globals.css`:
```css
@import "tailwindcss";

@theme inline {
  --color-background: #0a0a0a;
  --color-foreground: #fafafa;
  --color-card: #111111;
  --color-card-foreground: #fafafa;
  --color-primary: #fafafa;
  --color-primary-foreground: #0a0a0a;
  --color-secondary: #1a1a1a;
  --color-muted: #1f1f1f;
  --color-muted-foreground: #a3a3a3;
  --color-accent: #1f1f1f;
  --color-border: #262626;
  --color-input: #1a1a1a;
  --color-ring: #fafafa;
  --color-destructive: #ef4444;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --radius: 0.5rem;
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
}

@layer base {
  body {
    @apply bg-background text-foreground antialiased;
  }
}
```

Dark mode default. Toggle via `next-themes`.

---

## 12. The First 10 Prompts to Give Claude Code

In order. Don't skip steps. Each prompt should fully complete before moving to the next.

### Prompt 1 — Foundation read
```
Read PROJECT_SPEC.md and BUILD_INSTRUCTIONS.md fully. Then summarize:
1. The 6 product surfaces
2. The closed-loop learning flow
3. Why cheap-mode is default
4. The exact tech stack and pinned versions
5. The folder structure rules
Do NOT write any code yet. Confirm understanding only.
```

### Prompt 2 — Initialize project
```
Initialize the Next.js 14 project per BUILD_INSTRUCTIONS section 1 and 2.
- pnpm as package manager
- TypeScript strict mode
- Tailwind v4 with CSS-first config (section 11)
- ESLint + Prettier
- Create the full folder structure from section 2 (empty directories with .gitkeep where needed)
- package.json with exact pinned versions from section 1
- .env.local.example with section 3 template
- .gitignore from section 9
Do NOT install shadcn yet. Do NOT write any feature code.
```

### Prompt 3 — Supabase setup
```
Set up Supabase:
- Install @supabase/supabase-js and @supabase/ssr
- Create src/lib/supabase/client.ts, server.ts, admin.ts
- Create src/middleware.ts that protects all /(app)/ routes
- Create supabase/migrations/ folder
- Create the first migration: 20260514120000_init_extensions.sql with pgcrypto, citext, uuid-ossp
- Create scripts/generate-types.ts that pulls database.types.ts from Supabase
Do NOT create any feature tables yet. Foundation only.
```

### Prompt 4 — Schema migrations
```
Create all migration files from BUILD_INSTRUCTIONS section 5 in order, matching
PROJECT_SPEC section 3 exactly. One file per table. Include the indexes file
and RLS policies file. Use exact column names, types, constraints, and check
constraints from the spec. Do NOT add fields the spec doesn't have.
```

### Prompt 5 — Auth + sidebar shell
```
Build the auth flow per BUILD_INSTRUCTIONS section 4:
- /login page with magic link form (Supabase auth)
- /(auth)/callback/route.ts for the link callback
- src/middleware.ts redirects unauthenticated /(app)/ visitors to /login
- src/app/(app)/layout.tsx with sidebar shell from PROJECT_SPEC section 12
- Sidebar uses 64px collapsed / 240px hover-expanded pattern
- Empty page files for hot-list, call-queue, pipeline, generator, niches, dashboard, history, team, settings
- Each empty page shows the empty state from BUILD_INSTRUCTIONS section 6
- Default landing redirect logic from PROJECT_SPEC section 12
```

### Prompt 6 — shadcn/ui + base components
```
Install shadcn/ui (init with neutral base color, CSS variables yes, no rsc).
Add these components only (don't bulk-add):
button, card, input, label, select, dialog, drawer, sheet, tabs, table,
badge, separator, scroll-area, command, sonner, dropdown-menu, popover,
calendar, switch, slider, tooltip

Apply the Tailwind v4 tokens from BUILD_INSTRUCTIONS section 11 to globals.css.
Test by adding a single Button to the home page that fires a sonner toast.
```

### Prompt 7 — Settings shell + API keys
```
Build Settings page with sub-pages from PROJECT_SPEC section 12:
api-keys, pricing, health, blocklist, prompts.

For api-keys:
- Form with fields for: ANTHROPIC_API_KEY (required), GOOGLE_PLACES_API_KEY,
  APOLLO_API_KEY, HUNTER_API_KEY, SERPAPI_KEY, APIFY_TOKEN, LUSHA_API_KEY,
  COMPANIES_HOUSE_API_KEY, NOAA_API_KEY
- Encrypt values at rest in the api_keys table using ENCRYPTION_SECRET (AES-256-GCM)
- Show only last 4 chars of saved keys
- Admin role only — non-admins see "Read-only" view

For pricing-config: editable table of source/unit/cost rows.
For health, blocklist, prompts: empty placeholder pages, mark as Phase 7/9/13.
```

### Prompt 8 — Team management
```
Build Team page:
- Table of team_members with display_name, email, role, is_active
- Admin can invite new member by email (sends Supabase magic link with metadata)
- Admin can toggle role between admin/member
- Admin can deactivate members
- Non-admin sees read-only list
```

### Prompt 9 — Seed NAICS + Niche Explorer skeleton
```
Build scripts/seed-niches.ts and scripts/seed-shortlist.ts:
- Reads supabase/seed/naics_codes.csv (I'll provide separately — generate a
  placeholder with 20 real NAICS rows for now)
- Inserts into niches table with country_scope = ['US','CA','UK','AU'] for now
- Shortlist script flips is_shortlist on the curated subset

Build Niche Explorer page:
- Toggle: shortlist (default) / All NAICS
- Country multi-select filter
- Search input
- Grid of niche cards (name, naics_code, sector, is_favorited star)
- Click card → side drawer (empty for now, intelligence cards come in Phase 2)
```

### Prompt 10 — Niche intelligence (first real AI integration)
```
Build the Niche Intelligence layer per PROJECT_SPEC section 8.2 and 13.1:
- src/lib/ai/anthropic.ts with a Haiku 4.5 client
- src/lib/ai/prompts.ts with the niche intelligence prompt template
- src/lib/ai/parse-json.ts: safely parses JSON from Claude responses, strips
  markdown fences, handles malformed JSON
- /api/ai/niche-card/route.ts: takes niche_id + country, returns intelligence card
- Caches result in niche_intelligence table; if cached row exists, returns it
- "Regenerate" button on the side drawer (admin only)
- "Regenerate from web search" button (uses Claude with web search tool, costs ~$0.25)
- Side drawer renders all intelligence card fields with inline edit on each
- Edits flip generation_source to 'manual_edit' for that field
```

After Prompt 10, you have a working Niche Explorer with AI intelligence. Phase 1+2 complete. From here Prompts 11-30+ follow the build phases in PROJECT_SPEC section 16. The pattern is established.

---

## 13. Rules of Engagement for Claude Code

Put these in `CLAUDE.md` so Claude Code reads them every session:

1. **Always read PROJECT_SPEC.md and BUILD_INSTRUCTIONS.md before writing code.**
2. **Never invent features not in the spec.** If something seems missing, ask, don't guess.
3. **Never change pinned package versions** without asking why.
4. **Never create files outside the folder structure** without asking.
5. **Always use Haiku 4.5 for AI calls**, never Sonnet, never Opus.
6. **Always wrap external API/scrape calls in try/catch.** No exceptions.
7. **Always normalize phone numbers to E.164** before storing.
8. **Always compute and check fingerprint** before inserting any lead.
9. **Always check blocked_fingerprints** before inserting any lead.
10. **Always use Claude API via /api/ routes**, never from client-side.
11. **Never log API keys, never log full lead data in error messages.**
12. **Never use localStorage or sessionStorage** for state — use Supabase.
13. **Commit after each prompt completes successfully.** One commit per prompt.
14. **Default mode is cheap mode.** Paid APIs are opt-in toggles.
15. **Forced outcome logging is non-negotiable.** Never add a "skip" button.

---

## 14. Stop Signals — When to Pause and Check

Tell Claude Code to STOP and ask for confirmation if:

- Estimated cost for a feature exceeds $50 in API setup costs
- A migration would drop or recreate a table
- A new external service is being introduced
- Auth or RLS policies are being modified
- Anything in `src/lib/dedup/` or `src/lib/compliance/` is being changed
- The fingerprint algorithm is being changed (would invalidate the blocklist)
- More than 200 lines of code in a single file

---

## 15. Definition of "Phase X Complete"

A phase is complete when:
1. All features in that phase's spec section work end-to-end
2. Empty states are handled
3. Error states are handled
4. The phase's data flows are testable manually
5. Commit pushed to GitHub
6. Migration files (if any) are applied to Supabase
7. Types regenerated (`pnpm run generate-types`)
8. README updated with any new env vars or setup steps

Only after all 8 are true do you move to the next phase.

---

**End of build instructions.**
