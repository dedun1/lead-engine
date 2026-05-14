# Project Spec — Lead Engine v2

**Project codename:** Lead Engine
**Owner:** Eyad (TwentyFour)
**Purpose:** Internal desktop tool used by Eyad and the TwentyFour sales team to (1) research SMB niches across US/Canada/UK/AU, (2) generate enriched, deduplicated cold-call lead lists, (3) surface time-sensitive trigger events that make leads warmer, (4) provide AI-personalized pitch openers per lead, and (5) learn from every call to make future calls more effective.
**Not public.** No public signup. No marketing site. Team-of-N internal Electron desktop app.

---

## 1. Product Overview

Lead Engine has six core surfaces:

1. **Niche Explorer** — Browse industries, see AI-generated intelligence cards that EVOLVE based on your team's actual call outcomes (demand, avg ticket, pain points, TwentyFour fit score, your real conversion rate, your best opener, your top objections).
2. **Lead Generator** — Pick niche + country + region + filters → estimate cost → generate enriched leads. Cheap-first (free scrapers default, paid APIs opt-in). Permanent blocklist prevents bad leads from ever being regenerated.
3. **Trigger Hot List** — Daily-refreshed list of leads where SOMETHING changed: storm in their area, review velocity spike, recent negative review, website update, new business registration, Facebook resurrection, Google traffic spike. Call these first.
4. **Lead Pipeline** — Full lead table with filtering by status/outcome/objection. Call Queue mode for focused dialing.
5. **Call Console** — The screen you're on during a call. Shows lead detail, hyper-personalized AI opener for THIS lead, structured outcome logger that pops the instant the call ends.
6. **Learning Dashboard** — Pattern analysis across your team's calls. "Your conversion is 4x higher on roofers in TX than CA." "Opener variant B wins 3x more meetings." "Calls 10am-12pm prospect-local book 2x more."

Plus a **Settings** panel for API keys, team management, AI prompts, source health, blocklist review.

---

## 2. Tech Stack

- **Framework:** Next.js 14 App Router + TypeScript (matches TwentyFour)
- **Styling:** Tailwind v4 (`@import "tailwindcss"` + `@theme inline`) + shadcn/ui
- **Database:** Supabase (Postgres + Auth + RLS + Realtime) — shared across team
- **Tables UI:** @tanstack/react-table
- **AI:** Anthropic Claude API — **Haiku 4.5** for niche cards, lead summaries, personalized openers, pattern analysis. Sonnet reserved for nothing in this tool.
- **State / forms:** react-hook-form + zod
- **Toasts:** sonner
- **Icons:** lucide-react
- **Charts (Learning Dashboard):** recharts
- **Theme:** next-themes (dark default)
- **Background jobs:** Supabase Edge Functions + pg_cron for daily trigger scans
- **Desktop wrap:** Electron + electron-builder + electron-updater (auto-update via private GitHub Releases)
- **Scraping:** Playwright headless with stealth plugin; Cheerio for HTML parsing
- **Phone normalization:** libphonenumber-js
- **Timezone:** luxon

> Cursor / Claude Code is the primary coding tool. Eyad is a non-coder PM-style operator — write self-explanatory commits, descriptive variable names, and inline comments on any non-obvious logic.

---

## 3. Database Schema (Supabase)

All tables have `id uuid pk`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`. RLS enabled but permissive for authenticated team members.

### 3.1 `team_members`
- `email text unique`, `display_name text`, `role text check (role in ('admin','member'))`, `is_active boolean default true`

### 3.2 `niches`
- `naics_code text` (nullable for non-US fallbacks)
- `name text not null`
- `country_scope text[]` (e.g. `{US,CA,UK,AU}`)
- `is_shortlist boolean default false`
- `is_favorited boolean default false`
- `is_actively_pitching boolean default false`
- `parent_sector text`
- `weather_sensitive boolean default false` (roofing, HVAC, landscaping, etc. — drives storm trigger eligibility)

### 3.3 `niche_intelligence`
One row per (niche, country) pair. AI-generated baseline overlaid with real performance over time.

- `niche_id uuid fk`, `country text`
- `summary text`
- `automation_demand_score int (1-10)`
- `cold_call_viability_score int (1-10)`
- `twentyfour_fit_score int (1-10)`
- `avg_ticket_low numeric, avg_ticket_high numeric, currency text`
- `typical_bookings_per_month_low int, typical_bookings_per_month_high int`
- `typical_monthly_revenue_low numeric, typical_monthly_revenue_high numeric`
- `market_fragmentation text` (high/medium/low)
- `phone_dependency text` (high/medium/low)
- `existing_automation_adoption text` (low/medium/high)
- `best_regions text[]`
- `pain_points text[]`
- `twentyfour_pitch_angles text[]`
- `typical_owner_persona text`
- `generation_source text check (in ('claude_knowledge','claude_web_search','manual_edit'))`
- `generated_at timestamptz`
- `edited_by uuid fk`
- `last_refreshed_at timestamptz`

### 3.4 `niche_learned_intelligence` (NEW — performance overlay)
Recomputed nightly from `call_attempts`.

- `niche_id uuid fk`, `country text`, `region text` (nullable — region-level rollup)
- `total_calls int`, `total_pickups int`, `total_meetings_set int`, `total_customers int`
- `pickup_rate numeric`, `meeting_rate numeric`, `close_rate numeric`
- `best_call_hour_local int` (0-23, prospect-local-time with highest pickup rate)
- `best_call_day_local int` (0-6)
- `top_objections jsonb` — `[{objection, count, killed_deal}]`
- `top_pitch_opener_variant_id uuid fk`
- `avg_call_duration_seconds int`
- `pickup_rate_by_review_count_band jsonb`
- `pickup_rate_by_rating_band jsonb`
- `last_recomputed_at timestamptz`

### 3.5 `leads`
- `niche_id uuid fk`, `country text`, `region text`, `city text`, `postal_code text`
- `business_name text not null`, `address text`, `latitude numeric, longitude numeric`
- `business_phone text` (E.164), `business_phone_label text`
- `owner_name text`, `owner_phone text` (E.164), `owner_phone_source text`, `owner_phone_confidence text` (verified/unverified/likely)
- `owner_email text`, `owner_email_source text`
- `additional_contacts jsonb` — `[{name, role, phone, email, source}]`
- `website text`, `has_website boolean generated as (website is not null) stored`
- `socials jsonb` — `{facebook, instagram, linkedin, x, tiktok, yelp, bbb}`
- `google_rating numeric`, `google_review_count int`
- `yelp_rating numeric, yelp_review_count int`
- `bbb_rating text, bbb_accredited boolean`
- `employee_count_estimate int`, `employee_count_source text`
- `annual_revenue_estimate numeric`
- `business_hours jsonb`, `timezone text` (IANA)
- `ai_summary text` (Haiku-generated, 2-3 sentences)
- `source_log jsonb`
- `fingerprint text unique` — sha256(normalized name + phone + postal)
- `status text check (in ('new','queued','contacted','meeting_set','customer','dead','dnc')) default 'new'`
- `assigned_to uuid fk`
- `last_called_at timestamptz`
- `times_called int default 0`
- `seen_again_count int default 0`
- `is_blocked boolean default false`
- `blocked_at timestamptz`, `blocked_by uuid fk`, `blocked_reason text`

**Indexes:**
- `unique index on (fingerprint)` — DB-level dedup
- `index on (niche_id, country, region, city, status)` — pipeline filtering
- `index on (is_blocked)` — fast blocklist filtering
- `index on (assigned_to, status)`

### 3.6 `blocked_fingerprints` (NEW — permanent blocklist)
Permanent regeneration prevention.

- `fingerprint text unique not null`
- `business_name text`, `business_phone text`
- `city text, region text, country text`
- `reason text` — dropdown or free text ("wrong number", "out of business", "rude", "not interested permanently", "language barrier", "other")
- `blocked_by uuid fk`, `blocked_at timestamptz`
- `last_reviewed_at timestamptz` (nullable)

### 3.7 `call_attempts` (NEW — structured outcome log, the learning system's raw data)

One row per call attempt.

- `lead_id uuid fk`, `actor_id uuid fk`
- `called_at timestamptz`
- `prospect_local_hour int` (0-23, from lead's timezone)
- `prospect_local_day int` (0-6)
- `duration_seconds int` (nullable, only if pickup)

- **Outcome (required):**
  `outcome text check (in ('answered','voicemail','no_answer','busy','disconnected','wrong_number','do_not_call_requested'))`

- **Result (required if outcome='answered'):**
  `result text check (in ('meeting_set','interested_callback','not_interested','decision_maker_unavailable','hostile','price_objection_dead','wrong_decision_maker'))`

- **Objection (required if result in ('not_interested','price_objection_dead')):**
  `objection text check (in ('too_expensive','already_have_solution','no_budget','too_busy','not_owner','dont_trust_ai','language_barrier','offshore_concern','wrong_timing','no_interest','other'))`
  `objection_other text` (free text if objection='other')

- **Notes (optional free text):** `notes text`

- **Pitch opener used:** `opener_variant_id uuid fk` (nullable)

- **Callback (if result='interested_callback' or 'decision_maker_unavailable'):**
  `callback_at timestamptz`, `callback_note text`

### 3.8 `pitch_opener_variants` (NEW — A/B library)
- `niche_id uuid fk` (nullable — null = global)
- `lead_id uuid fk` (nullable — non-null = per-lead personalized opener)
- `country text` (nullable)
- `name text` — short label
- `opener_text text not null`
- `is_active boolean default true`
- `is_personalized boolean default false`
- `created_by_id uuid fk` (null if Claude-generated)
- `times_used int default 0`
- `meetings_set int default 0`
- `conversion_rate numeric generated as (case when times_used > 0 then meetings_set::numeric / times_used else 0 end) stored`

### 3.9 `trigger_events` (NEW — intent signals)
- `lead_id uuid fk`
- `trigger_type text check (in ('review_velocity_spike','recent_negative_review','storm_in_area','new_business_registration','website_change','facebook_resurrection','google_traffic_spike'))`
- `detected_at timestamptz`
- `details jsonb` — trigger-specific payload
- `severity text check (in ('low','medium','high'))`
- `is_acted_on boolean default false`
- `expires_at timestamptz`

### 3.10 `lead_activities`
Append-only log.
- `lead_id uuid fk`, `actor_id uuid fk`, `activity_type text`, `payload jsonb`

### 3.11 `generation_jobs`
- `niche_id uuid fk`, `country text, region text, city text, postal_code text`
- `requested_count int, delivered_count int`
- `filters jsonb`
- `estimated_cost_usd numeric, actual_cost_usd numeric`
- `cost_breakdown jsonb`
- `started_by uuid fk, started_at timestamptz, completed_at timestamptz`
- `status text check (in ('estimating','running','paused','completed','failed','cancelled'))`
- `error_log text`
- `dedup_skip_count int default 0`
- `blocklist_skip_count int default 0`

### 3.12 `api_keys`
Encrypted at rest. Admin-only.

### 3.13 `pricing_config`
- `source text unique`, `unit text`, `cost_usd numeric`, `notes text`

### 3.14 `scraper_health`
- `source text`, `status text check (in ('healthy','degraded','down'))`, `last_check_at timestamptz`, `last_error text`, `consecutive_failures int`

### 3.15 `weekly_insights`
- `week_starting date`, `insight_text text`, `dismissed_by uuid[]`, `created_at timestamptz`

---

## 4. Data Sources & Integration — Cheap-First Waterfall

**Design principle:** every enrichment field has a free tier and a paid tier. Waterfall runs free sources first, falls back to paid only if user enabled paid mode AND free path missed. Default target: $0.02-0.04 per fully-enriched lead.

### 4.1 Always-on free backbone
| Source | Purpose | Cost | Method |
|---|---|---|---|
| Google Maps scraper (Playwright + stealth) | Business name, phone, website, hours, rating, reviews, address | $0 self-hosted | Scrape |
| Anthropic Claude Haiku 4.5 | Niche cards, lead summaries, openers, pattern analysis | ~$0.005/niche, ~$0.003/lead | Official API |
| Supabase | Storage + Auth + Realtime + Edge Functions | Free tier | Official |

### 4.2 Free enrichment waterfall

**Owner name:**
1. Website scrape: `/about`, `/team`, `/contact`, `/our-story`, `/staff` (~80% hit rate)
2. DuckDuckGo HTML for `"[business name] owner"` / `"... founder"`
3. Public business registries:
   - UK: Companies House official API (free)
   - US: TX SOSDirect, FL SunBiz, CA Bizfile, NY DOS scrapers
   - Canada: ON, BC, AB, QC provincial registries
   - Australia: ASIC scrape
4. Facebook Page Transparency "people who manage this Page" (~30% hit rate, flaky)
5. (paid fallback, opt-in): Apollo people search

**Owner email:**
1. If owner name + domain → pattern generation (`firstname@`, `first.last@`, etc.)
2. Free SMTP probe verify (`email-existence` Node package)
3. Scrape `/contact` for `mailto:` links
4. (paid fallback): Hunter.io

**Owner phone:**
1. If business <5 employees: business phone IS likely owner mobile → label `"Business Line (likely owner — small operator)"`
2. Scrape `/contact`, `/about` for inline phone numbers
3. Facebook page WhatsApp link → reveals WhatsApp number
4. Instagram bio scrape
5. (paid fallback): Apollo / Lusha mobile

**Socials, employee count, Yelp, BBB:** all free or near-free.

### 4.3 Optional paid layer (opt-in per job)

| Source | When | Cost |
|---|---|---|
| Apollo.io pay-per-credit | 10+ employee targets where business phone ≠ owner | ~$0.10-0.30/contact |
| Hunter.io | SMTP verification failed | ~$0.04/lookup |
| Lusha mobile | Last-resort high-value targets | ~$0.50/lookup |
| Apify Google Maps actor | Our scraper down | $1-5 per 1000 |
| SerpAPI | DuckDuckGo blocked | ~$0.005/search |
| Official Google Places API | Emergency scraper fallback | $0.017/lookup |

### 4.4 Trigger event sources (see §7)

All free. Cost is only Supabase Edge Function execution.

| Trigger | Source |
|---|---|
| Review velocity spike | Weekly re-scrape Google Maps on monitored leads, compare review counts |
| Recent negative review | Same scrape, check recent 3 reviews for rating ≤2 |
| Storm in area | NOAA Severe Weather Data API |
| New business registration | Weekly delta scan of SoS/Companies House in monitored regions |
| Website change | Weekly fetch, hash + text-shingle diff |
| Facebook resurrection | Weekly FB page post recency check |
| Google traffic spike | Google Maps "Popular times" scrape, week-over-week delta |

---

## 5. Dedup + Permanent Blocklist Logic

### 5.1 Fingerprint
```ts
function generateFingerprint(lead: Lead): string {
  const normalizedName = lead.business_name
    .toLowerCase()
    .replace(/\b(llc|inc|ltd|corp|company|co|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
  const normalizedPhone = (lead.business_phone || lead.owner_phone || '')
    .replace(/\D/g, '')
    .slice(-10);
  const postal = (lead.postal_code || '').replace(/\s/g, '').toUpperCase();
  return sha256(`${normalizedName}|${normalizedPhone}|${postal}`);
}
```

### 5.2 Insert flow during generation

```
For each candidate lead from any scraper:
1. Compute fingerprint
2. Check blocked_fingerprints → if match, SKIP, increment blocklist_skip_count
3. Check leads table by fingerprint → if match:
   a. Increment leads.seen_again_count
   b. Merge newly-discovered fields into existing row if existing is null
   c. Increment dedup_skip_count
   d. Do NOT count toward requested_count quota
4. Else: insert new lead, count toward quota
```

### 5.3 Blocklist behavior

On "Block + Delete":
- Fingerprint copied to `blocked_fingerprints`
- Lead in `leads` flagged `is_blocked = true` (NOT row-deleted — audit trail + prevents accidental re-discovery via different scraper)
- Reason captured (dropdown + optional free text)
- Lead hidden from all pipeline views
- Fingerprint blocked **forever** from regeneration

### 5.4 Monthly blocklist review panel

Settings → Blocklist Review:
- Table of all blocked entries, sorted by `blocked_at` desc
- Columns: business name, phone, city, reason, blocked by, blocked when, last reviewed
- Filter by: reason, age, blocker
- Bulk select → "Unblock selected" (removes from `blocked_fingerprints`, flips `is_blocked = false`)
- "Mark reviewed" updates `last_reviewed_at`
- Settings home reminder card: "47 blocks added since last review — review now"

Reason for the review panel: blocks default to forever (clean and safe), but ownership changes / mis-clicks / wrong-time-of-life situations can make stale blocks. Monthly review keeps list correct without abandoning the default-forever safety.

---

## 6. Cost Estimator

Modal shown before any generation. Cheap mode default.

### Cheap mode
```
Generating 200 leads — Houston, TX — Roofing Contractors
Mode: Cheap (free sources only)

Free sources:
  Google Maps scrape          200 listings       $0.00
  Website self-scrape         200 pages          $0.00
  DuckDuckGo owner search     ~400 queries       $0.00
  Texas SOSDirect lookup      200 lookups        $0.00
  Facebook Page Transparency  200 lookups        $0.00
  Email pattern + SMTP verify 200 attempts       $0.00
  Yelp + BBB cross-ref        200 lookups        $0.00

Paid (Claude Haiku only):
  Lead summary                200 × $0.001       $0.20
  Personalized opener         200 × $0.002       $0.40

Estimated total:                                 $0.60
Estimated time:                                  ~12 min

Expected completeness:  ~75% leads fully enriched
                        ~25% partial (owner name missing)

[ ] Enable paid fallback for the ~25% partial
    (adds ~$8-15 via Apollo + Hunter)

[Cancel]  [Run Generation]
```

### Settings caps
- "Don't generate if estimate > $X" (default $25)
- "Pause if running cost exceeds estimate by X%" (default 50%)
- Monthly total spend cap with alert at 80%

---

## 7. Trigger Events — The Hot List

### 7.1 What gets monitored

Only leads where `niche.is_actively_pitching = true` AND `lead.is_blocked = false` AND `lead.status not in ('customer','dnc','dead')`. Keeps compute scoped.

### 7.2 Daily background scan (Supabase Edge Function + pg_cron, 4am UTC)

**1. Review velocity spike**
- Re-scrape Google Maps review count, compare to last week
- Trigger if reviews-per-day > 2x trailing 90-day baseline AND absolute new ≥ 3
- Severity: high if 4x+, medium if 2-4x

**2. Recent negative review**
- 3 most recent reviews, any with rating ≤ 2 in last 7 days
- Severity: high

**3. Storm in area**
- NOAA Severe Weather Data API, daily fetch by lead lat/lng ±50mi
- Types: hail (any), severe wind ≥58mph, tornado, ice storm
- Only for niches where `weather_sensitive = true`
- Severity: high within 48hrs, medium within 7 days

**4. New business registration**
- Weekly delta scan of state/Companies House for new filings in monitored regions
- Auto-create as lead with trigger if niche matches
- Severity: medium

**5. Website change**
- Weekly fetch, hash + text-shingle diff
- Significant = >20% content change
- Severity: low

**6. Facebook resurrection**
- Weekly FB page post recency
- Trigger if no post ≥60 days then post in last 7 days
- Severity: medium

**7. Google "Popular times" spike**
- Weekly scrape of Popular times data
- Trigger if today's busy-ness > 1.5x same-day-of-week 4-week average
- Severity: low

### 7.3 Hot List UI

Top-level sidebar page. Default landing if active triggers exist.

- Cards sorted by severity, then `detected_at` desc
- Each card: business name, city, niche, trigger type + icon, 1-line context, big "Call Now" button
- "Call Now" → opens Call Console with trigger-aware Claude-generated opener:

> *"Hey John — saw a customer left a tough review yesterday about a delayed quote, that's literally what we fix at TwentyFour, got 30 seconds?"*

- Auto-expire per `expires_at` (storm: 14 days, review spike: 30 days, etc.)
- "Mark acted on" hides from list but keeps in DB for analytics

---

## 8. Hyper-Personalized Pitch Openers

### 8.1 Per-niche baseline (templates)

When you mark a niche `is_actively_pitching`, Claude generates 5 baseline opener variants. Stored with `lead_id = null` (niche-level). User can edit, deactivate, add custom.

### 8.2 Per-lead personalized (NEW)

During lead generation, after enrichment completes, Claude is called with:
- Business name, niche, recent reviews summary, website "about" snippet, location, hours quirks, trigger events, employee count
- Plus the top 2 best-converting niche-level openers as style references

Returns 1 personalized opener stored with `lead_id = <this lead>`, `is_personalized = true`. Cost ~$0.002 per lead.

Example for a roofer:
> *"Hey Mike — I noticed Apex Roofing's last 3 reviews on Google mentioned waiting 4+ days for a quote. That delay is exactly what TwentyFour fixes — your customers get an instant AI-generated quote within 5 minutes. Got 30 seconds?"*

### 8.3 Call Console display

Big card at top of Call Console showing the personalized opener. Dropdown below to swap to a niche-level variant. Whichever is USED gets logged on the call attempt for A/B analysis.

### 8.4 A/B learning

After 30+ uses per variant:
- Auto-computed `conversion_rate`
- If a variant has <40% of the best variant's rate AND used ≥30 times → flag as "underperforming"
- "Best Opener" badge on top performer per niche
- Settings → "Refresh openers" regenerates 5 new variants using best historical as style example

---

## 9. Call Console — The Active-Call UI

The screen during a call. Make the call effective, log outcome the instant it ends.

### 9.1 Layout (single full-screen view)

**Top strip:** Lead name, business name, business phone (big, `tel:` link), owner name, city + prospect-local-time + "open now until X" countdown

**Left column — Lead context:**
- Business summary (Haiku 2-3 sentences)
- Recent reviews (last 3 scraped)
- Trigger events on this lead, highlighted
- Website link, social icons
- Past call attempts with prior notes

**Center column — Pitch opener card:**
- Personalized opener in large text
- "Use this opener" button → logs which variant chosen
- Dropdown to swap to niche-level

**Right column — Niche cheat sheet:**
- 3 pain points
- Top 3 objections + your team's best rebuttals (from `niche_learned_intelligence`)
- Avg ticket / monthly revenue
- TwentyFour pitch angles

**Bottom strip:** Outcome logger (collapsed during call, expands when call ends — see 9.2)

### 9.2 Outcome logging (FORCED post-call)

The instant the call ends (user clicks "Call ended" or after configurable timeout from `tel:` launch), a modal **forces** logging before any other action:

**Step 1 — Outcome (required):**
`Answered | Voicemail | No Answer | Busy | Disconnected | Wrong Number | DNC Requested`

**Step 2 — If Answered, Result (required):**
`Meeting Set | Interested Callback | Not Interested | Decision Maker Unavailable | Hostile | Price Objection | Wrong Decision Maker`

**Step 3 — If Not Interested or Price Objection, Objection (required):**
`Too expensive | Already have solution | No budget | Too busy | Not the owner | Don't trust AI | Language barrier | Offshore concern | Wrong timing | No interest | Other...`

**Step 4 — Notes (optional):** 1-3 lines

**Step 5 — Callback (if Interested Callback or DM Unavailable):**
Date+time picker (prospect-local), optional note

**Step 6 — Action buttons:**
`Save & Next Lead | Save & Block This Lead | Save & Set Status: [Meeting Set | Customer | Dead]`

### 9.3 Why force immediate logging

Cold callers who batch outcome logging at end-of-session lose 60-70% of detail. The objection remembered at 5pm isn't the objection actually heard at 11am. Forcing immediate structured logging is the difference between useful learning data and garbage data. **The friction is the feature.** After 2 weeks the Learning Dashboard insights make it worth the friction.

---

## 10. Filters (Lead Generator + Pipeline)

### 10.1 Generator filters

All optional except country+region. Always auto-excludes `is_blocked=true` and `status='dnc'`.

- Country (US/CA/UK/AU) — required
- Region — required, populated by country
- City or postal — optional
- Has website (yes/no/either)
- Google star rating (range 1.0–5.0)
- Google review count (range 0–5000+)
- Currently open (yes/no/any)
- Employee count estimate (range)
- Has owner contact resolved (yes/no/any)

### 10.2 Pipeline filters (richer)

All generator filters plus:
- **Status:** new, queued, contacted, meeting_set, customer, dead, dnc (multi)
- **Last outcome:** multi
- **Last result:** multi
- **Top objection encountered:** dropdown
- **Times called ≥ N:** number
- **Last called within / before:** date range
- **Has active trigger event:** yes/no
- **Assigned to:** team member
- **Niche / region / city:** dropdown

Saved filter views per user.

---

## 11. Learning Dashboard

Sidebar page. Powered by `call_attempts` + `niche_learned_intelligence`.

### 11.1 Top cards
- Total calls this week / month
- Pickup rate (overall + by niche)
- Meeting-set rate (overall + by niche)
- Avg calls per meeting
- Cost per meeting (generation cost ÷ meetings set)

### 11.2 Charts (recharts)
- **Conversion funnel by niche:** calls → pickups → meetings → customers
- **Best time to call:** heatmap day × hour, colored by pickup rate
- **Opener performance:** bar chart conversion rate per variant, with sample size
- **Objection landscape per niche:** what kills deals
- **Trigger effectiveness:** pickup rate trigger-warm vs cold
- **Region performance:** bar chart by region

### 11.3 AI insights panel (NEW)

Every Monday 6am, Claude runs over week's `call_attempts` → writes 3-5 plain-English actionable insights:

> *"Roofers in TX convert 4.2x higher than CA — concentrate outbound on TX."*
> *"Opener 'storm-warm hook' has 3x meeting rate but only used 17 times. Use more."*
> *"Pickup rate 2.4x higher 10am-12pm prospect-local. Rearrange windows."*
> *"Med spas with 50-200 reviews convert 4x better than 500+. Narrow filters."*

Stored in `weekly_insights`, shown on dashboard, dismissable. Cost ~$0.05/week.

---

## 12. UI Structure (sidebar nav)

Collapsed 64px → expanded 240px on hover (TwentyFour pattern):

- 🔥 Hot List — badge with active trigger count
- 📞 Call Queue
- 📋 Lead Pipeline
- 🎯 Lead Generator
- 🏭 Niche Explorer
- 📊 Learning Dashboard
- 📜 Generation History
- 👥 Team
- ⚙️ Settings → API Keys | Pricing Config | Source Health | Blocklist Review | AI Prompts

Default landing logic:
1. If active triggers exist → Hot List
2. Else if leads in `queued` or callbacks due → Call Queue
3. Else → Lead Pipeline

---

## 13. AI Prompts

All in `ai_prompts` table, editable in Settings. Versioned.

### 13.1 Niche intelligence
```
You are a B2B sales analyst evaluating whether {{niche_name}} in {{country}}
is a strong target for selling AI-powered business automation (appointment
reminders, missed-call SMS auto-reply, AI quote scheduling, follow-up
automation, review-response automation).

Return ONLY valid JSON:
{
  "summary": "...",
  "automation_demand_score": 1-10,
  "cold_call_viability_score": 1-10,
  "twentyfour_fit_score": 1-10,
  "avg_ticket_low": number, "avg_ticket_high": number, "currency": "USD|CAD|GBP|AUD",
  "typical_bookings_per_month_low": int, "typical_bookings_per_month_high": int,
  "typical_monthly_revenue_low": number, "typical_monthly_revenue_high": number,
  "market_fragmentation": "high|medium|low",
  "phone_dependency": "high|medium|low",
  "existing_automation_adoption": "low|medium|high",
  "best_regions": ["..."],
  "pain_points": ["..."],
  "twentyfour_pitch_angles": ["..."],
  "typical_owner_persona": "..."
}

Be directionally accurate. Use ranges, never invented precision.
```

### 13.2 Personalized opener
```
You are a cold-call opener writer. Caller is from TwentyFour (twentyfour.app),
an AI automation service for SMBs handling missed calls, appointment reminders,
AI quote scheduling, review-response automation.

The caller has 8 seconds before the prospect decides to listen or hang up.

The opener must:
- Open with prospect's first name (or "Hey there" if unknown)
- Reference something SPECIFIC about THIS business (recent review, website
  signal, pain point) — never generic
- Connect that specific thing to a TwentyFour capability
- End with low-commitment ask ("got 30 seconds?")
- Stay under 35 words
- Sound human, not scripted

Business: {{business_name}}
Niche: {{niche_name}}
Owner first name: {{owner_first_name}}
Recent reviews: {{recent_reviews}}
Website "about" snippet: {{website_snippet}}
Trigger events: {{trigger_events}}
Best-performing opener for this niche (style ref): {{top_opener}}

Return ONLY opener text, no preamble, no quotes.
```

### 13.3 Lead summary
```
Generate a 2-3 sentence summary of this business for a cold-caller. Focus on:
what they do, apparent size/maturity, signals of automation pain (slow review
responses, no online booking, old website, missing hours, etc.).

Business: {{business_name}}
Website snippet: {{website_text}}
Recent reviews: {{recent_reviews}}
Rating: {{rating}} ({{review_count}} reviews)
Hours: {{hours}}
```

### 13.4 Weekly insights
```
You are reviewing the week's cold-call data for TwentyFour. Generate 3-5
plain-English ACTIONABLE insights. Focus on what to DO differently next week.
Reference niches, regions, openers, time windows by name. Each insight under
30 words.

Data:
{{calls_summary_json}}

Return JSON array of strings.
```

---

## 14. Electron Setup

- `electron-builder` config in `package.json`
- `electron-updater` → private GitHub Releases
- Auto-update on app start + every 6hrs while open
- Code-signing for Windows (v2 — required to dodge SmartScreen)
- macOS notarization deferred to v2
- App icon, splash screen, "Lead Engine" branding

```
npm run build:win    # Windows installer (.exe)
npm run build:mac    # later
npm run release      # builds + publishes to GitHub Releases
```

Team install: each member downloads .exe from a private GitHub Release URL Eyad shares once. Auto-updates are silent after that.

---

## 15. Compliance Notes

- **US:** TCPA — manual dial only for cell numbers. Weekly National DNC scrub. FL, OK, WA, MD stricter. Calling hours 8am–9pm prospect-local.
- **Canada:** CASL — B2B cold calls allowed. DNCL for consumer.
- **UK:** PECR + GDPR — corporate subscribers callable unless CTPS-registered. Sole traders = consumers.
- **Australia:** Spam Act + DNCR — B2B exempt for calls.

**Built-in scrubs:**
- US National DNC weekly cron
- UK CTPS pre-call API check
- AU DNCR weekly

Not legal advice. Get a lawyer before bulk-calling beyond a few hundred per week.

---

## 16. Build Phases

### Phase 1 — Foundation (Week 1)
- Next.js + Tailwind v4 + shadcn + Supabase
- Auth
- Full DB schema (§3)
- Sidebar shell, empty pages
- Settings → API keys (encrypted)
- Team management
- Seed NAICS taxonomy (1057 niches, CSV import)
- Seed curated shortlist (~150 with `is_shortlist=true`)

### Phase 2 — Niche Explorer (Week 2)
- Niche grid + search + country + shortlist/all toggle
- Claude Haiku → generate `niche_intelligence` on click
- Inline edit
- Favorites + actively-pitching flags
- "Regenerate from web search" admin (opt-in paid)

### Phase 3 — Lead Generator core (Week 2-3)
- Country → Region → City selector
- Google Maps Playwright scraper (stealth + throttle + health check)
- Filters
- Fingerprint generation
- `blocked_fingerprints` check before insert
- "Check city size" preview
- Cost estimator modal (cheap default)
- Generation runner with progress
- `generation_jobs` logging

> **End of Week 3 = usable v1. Eyad starts cold calling in parallel while remaining phases build.**

### Phase 4 — Free enrichment waterfall (Week 3-4)
- Website self-scrape (Cheerio) for owner name
- DuckDuckGo HTML for `"[business] owner"`
- UK Companies House API
- US TX/FL/CA/NY registry scrapers
- Email pattern + free SMTP probe
- Facebook Page Transparency
- Heuristic employee count
- Claude Haiku lead summary
- Source labeling on every contact field

### Phase 5 — Pipeline + Call Console + Call Logging (Week 4-5)
- Pipeline table (all §10 filters)
- Call Queue mode
- **Call Console (§9 full screen)** — context + opener + cheat sheet
- Outcome logging modal (forced, structured, post-call)
- `call_attempts` write
- Status management
- Block + Delete with reason capture
- CSV export

### Phase 6 — Personalized Openers (Week 5)
- Niche-level baseline generation (5 per active niche)
- Per-lead personalized generation during enrichment
- A/B tracking (`times_used`, `meetings_set`, auto `conversion_rate`)
- "Best opener" badge
- Opener swap in Call Console

### Phase 7 — Trigger Events / Hot List (Week 5-6)
- 7 detectors (§7.2)
- Daily Supabase Edge Function + pg_cron
- NOAA Severe Weather API
- Weekly registry delta scans
- Website hash + shingle diff
- Hot List UI
- Trigger-aware opener generation
- Auto-expire

### Phase 8 — Learning Dashboard (Week 6-7)
- Charts (recharts): funnel, time heatmap, opener perf, objection landscape, region perf
- `niche_learned_intelligence` nightly recompute
- Weekly Claude AI insights (Monday 6am cron)
- Dismissable insight cards

### Phase 9 — Blocklist Review + Compliance + Polish (Week 7)
- Settings → Blocklist Review panel
- Monthly review reminder
- US DNC weekly scrub cron
- UK CTPS, AU DNCR scrubs
- Scraper health monitor + auto-failover
- Saved views per user
- Keyboard shortcuts on Call Queue

### Phase 10 — Electron Wrap (Week 7-8)
- `electron-builder` config
- `electron-updater` + private GitHub Releases
- Windows installer
- Splash + icon + branding
- Team rollout

### Phase 11 — Optional Paid Fallback Layer (Week 8, optional)
- Apollo, Hunter, Lusha as opt-in fallbacks
- Apify Google Maps as scraper backup
- SerpAPI as DuckDuckGo backup
- Official Google Places API as emergency button

---

## 17. Out of Scope (v1)

- Public signup / billing / multi-tenant
- Mobile app
- Auto-dialer (manual dial only — TCPA)
- Email sending / sequences (Smartlead later)
- SMS sending
- CRM integrations (HubSpot, Salesforce) — CSV export covers
- X/Twitter scraping
- LinkedIn scraping
- Real-time call recording / transcription (interesting v2: Whisper post-call transcription auto-fills outcome dropdowns)
- Proposal / contract generation (handoff at "meeting set")

---

## 18. Done Definition for v1

You and your team can:
1. Open Electron app on Windows
2. See Hot List with trigger-warm leads at top
3. Pick niche → US → Texas → Houston → see "~847 available, $0.60 estimate"
4. Generate → in ~12 min: 200 enriched, deduped, blocklist-filtered leads
5. Open Call Console for any lead → see personalized opener + cheat sheet
6. Click `tel:` → make the call
7. Log outcome via forced structured modal in 5 sec → next lead
8. After 50 calls: Learning Dashboard shows real conversion patterns
9. After 200 calls: Weekly AI insights tell you what to double down on
10. Block 47 leads as "wrong number" → never see them again
11. Browse Niche Explorer, mark Med Spas as next pitch → 5 baseline openers generated
12. Settings → Source Health: all green
13. Real-time sync across team

---

## 19. Anti-patterns to Avoid

- Don't invent owner phone data. Source labels non-negotiable.
- Don't auto-dial cell phones in US — TCPA real money.
- Don't scrape LinkedIn programmatically.
- Don't ship without cost estimator.
- Don't skip fingerprint dedup at DB level.
- Don't put API keys in env vars only — encrypt in `api_keys` table.
- Don't auto-generate niche cards for all 1057 NAICS on first run — only on click.
- Don't default to paid enrichment. Cheap mode is default.
- Don't scrape Google Maps without throttling. 1-2 req/sec, stealth, rotating UA.
- Don't use Sonnet 4 where Haiku 4.5 works.
- Don't allow outcome logging to be skipped. Dashboard depends on it.
- Don't delete blocked leads — preserve in `leads` for audit.
- Don't auto-expire blocklist. User decides at monthly review.
- Don't generate niche-level openers for niches not actively pitching — wastes tokens.
- Don't scrape FB/IG on every generation — only for actively-pitched niches.
- Don't trust trigger events without expiry. Stale triggers waste calls.

## 19a. Scraper Resilience

- Each scraper module exposes `health_check()` running daily via cron
- 3 consecutive failures → auto-disable, alert admin, fall back to paid alternative
- Every scrape wrapped in try/catch — one source failing never blocks a job
- Log to `scraper_health` table
- Settings → Source Health panel: green/yellow/red per source
- Rotating residential proxies optional (~$15/mo) if specific sources block hard

---

## 20. Open Questions for Eyad (resolve during Phase 1)

1. **Brand name** — "Lead Engine" is placeholder. Final?
2. **Team size at launch** — affects Supabase tier and Claude spend ceiling.
3. **First 3 niches** to seed with intelligence cards + active opener libraries — Roofers + ???
4. **CSV export schema** — does downstream dialer/CRM need specific format?
5. **US virtual number setup** — OpenPhone, Aircall, or personal mobile? Affects `tel:` link behavior and future click-to-call integration.
6. **Time-to-callback default** — if prospect says "next week," what's the default reminder window?

---

**End of spec.**
