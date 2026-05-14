# Lead Engine

Internal lead generation + cold-call intelligence tool for the TwentyFour sales team.

> **This is a private tool.** Do not share access. Do not deploy publicly.

---

## What it does

- Researches SMB niches across US, Canada, UK, Australia
- Generates enriched, deduplicated cold-call lead lists from Google Maps and free public sources
- Surfaces time-sensitive trigger events (storms, review spikes, new businesses) so you call the warmest leads first
- Generates AI-personalized pitch openers per individual lead
- Forces structured call outcome logging so the team learns from every call
- Shows weekly AI insights on what's working

---

## Setup (admin, first time only)

### 1. Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- A Supabase project (free tier)
- An Anthropic API key (https://console.anthropic.com)

### 2. Clone and install
```bash
git clone <private-repo-url> lead-engine
cd lead-engine
pnpm install
```

### 3. Environment
```bash
cp .env.local.example .env.local
# Fill in Supabase URL + keys + ANTHROPIC_API_KEY + ENCRYPTION_SECRET
# Generate ENCRYPTION_SECRET: openssl rand -hex 32
```

### 4. Database
```bash
pnpm supabase login
pnpm supabase link --project-ref <your-project-ref>
pnpm supabase db push
pnpm run generate-types
pnpm run seed:niches
pnpm run seed:shortlist
pnpm run seed:pricing
```

### 5. First admin user
- Open Supabase dashboard → Authentication → Users → invite yourself by email
- Magic link arrives, click it
- Run this SQL in Supabase to make yourself admin:
  ```sql
  insert into team_members (email, display_name, role, is_active)
  values ('your@email.com', 'Your Name', 'admin', true);
  ```

### 6. Run
```bash
pnpm dev
# Opens at http://localhost:3000
```

---

## Setup (team members, after admin invite)

1. Receive email invite from admin
2. Click magic link → set display name
3. Download the Lead Engine .exe from the link admin shares
4. Run installer
5. Sign in with the same email — app remembers session for 30 days

---

## Daily usage

1. Open the app — lands on Hot List if any active triggers, else Pipeline
2. Hot List: call the trigger-warm leads first
3. Generator: pick niche → country → region → city → filters → generate
4. Pipeline: filter to your assigned leads, open Call Queue
5. After each call: forced outcome modal — log in 5 seconds, next lead
6. Mondays: check Learning Dashboard for weekly AI insights

---

## Cost expectations

Default cheap mode: ~$0.003 per fully-enriched lead (just Claude Haiku for summary + opener).

200 leads typically costs ~$0.60 to generate. Monthly all-in for typical team usage: $15-40.

Hard caps configurable in Settings → Pricing. You will never be surprised by a bill.

---

## Architecture

See `PROJECT_SPEC.md` for full feature spec.
See `BUILD_INSTRUCTIONS.md` for tech stack, folder layout, build phases.
See `CLAUDE.md` for Claude Code working rules.

---

## Compliance

Read `PROJECT_SPEC.md` section 15 before bulk-calling any country. This tool is not a substitute for legal review. Built-in DNC scrubs run weekly for US/UK/AU but compliance is a team responsibility.

---

## Support

Internal tool. Issues → Eyad.
