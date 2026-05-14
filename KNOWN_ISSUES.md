# Known Issues & Fallback Strategies

A list of friction points that WILL occur during the Lead Engine build. Each has a documented mitigation strategy. Refer to this when Claude Code hits one — don't improvise.

> **Rule:** if Claude Code encounters one of these issues during a build session, it should reference this document, apply the documented mitigation, and continue. Don't get stuck.

---

## Issue 1 — Google Maps scraper blocks after N requests

**What happens:**
Playwright + stealth gets you ~100-300 listings cleanly. Beyond that, Google starts inserting CAPTCHAs, throttling, or returning empty pages.

**Symptoms:**
- Scraper returns 0 results for a search that obviously has results
- Page loads with reCAPTCHA visible
- Connection times out repeatedly on same IP
- HTML response missing the expected listing selectors

**Mitigation (in order):**
1. Throttle harder: increase delay between requests to 3-5 seconds (from default 1-2s)
2. Rotate user-agent strings on every request (`@playwright-extra/plugin-stealth` does this)
3. Add randomized mouse movements + scroll behavior before extracting (stealth plugin)
4. Reduce session size: max 50 listings per browser session, then close and reopen
5. If still blocked → auto-fall-back to Apify Google Maps actor ($1-5 per 1000 results) — flagged in Settings → Source Health as "degraded"
6. Last resort: residential proxy via Bright Data (~$15/mo) — opt-in toggle

**Anti-pattern:**
Do NOT solve CAPTCHAs programmatically. Do NOT scrape from cloud IPs (datacenter IPs get blocked faster). Run scraper from the user's machine when possible.

**How to detect health:**
`scraper_health.health_check()` for Google Maps runs daily — searches for "starbucks new york" and expects ≥3 results. If fails 3 days in a row, auto-disable + email admin.

---

## Issue 2 — State Secretary of State scrapers are each unique

**What happens:**
TX SOSDirect, FL SunBiz, CA Bizfile, NY DOS all have completely different HTML structures, search forms, and rate limits. Some require POST requests with hidden CSRF tokens. Some have inline JavaScript that builds the result table.

**Symptoms:**
- One state works, another returns nothing
- HTML structure changes after they redesign (happens 1-2x per year)
- Rate limit hit after 50-100 lookups per hour

**Mitigation:**
1. Build each state as a separate module in `src/lib/scrape/sos-{state}.ts` with isolated logic
2. Wrap each in try/catch — one state failing never blocks the enrichment job
3. Cache results per (business_name + state) for 90 days — same business often searched repeatedly
4. Rate limit per state: max 30 lookups/minute, configurable per state in `pricing_config`
5. If a state scraper fails 3 times in a row → auto-disable that state's enrichment, fall back to OpenCorporates (paid, ~$0.05/lookup) for that state only

**Build priority order:**
1. UK Companies House — free official API, easy, do FIRST (it's not a scraper, it's just an API call)
2. TX SOSDirect — biggest pool of small businesses
3. FL SunBiz — second biggest, well-documented HTML
4. CA Bizfile — has more anti-bot measures, expect friction
5. NY DOS — different from TX/FL/CA, save for last

Don't try to build all 4 US scrapers at once. Build TX, ship, observe for a week, then add FL.

---

## Issue 3 — NOAA Severe Weather API specifics

**What happens:**
NOAA has multiple APIs (NWS API, SPC, IEM). The right one for storm-trigger detection is the NWS API (`api.weather.gov`). It's free, no API key needed, but rate-limited and quirky.

**Mitigation — specific implementation guidance:**

Endpoint to use:
```
GET https://api.weather.gov/alerts/active?status=actual&message_type=alert&point={lat},{lng}
```

Active alerts only. Returns GeoJSON.

What to extract per alert:
- `event` field — match against: `Hail Warning`, `Severe Thunderstorm Warning`, `Tornado Warning`, `Tornado Watch`, `Ice Storm Warning`, `High Wind Warning`
- `severity` field — Extreme / Severe / Moderate / Minor
- `effective` and `expires` timestamps
- `description` — short summary for the trigger card

Rate limit: 60 requests/minute per IP. Stay well under by:
- Batching leads by zip code (one alert query per unique zip, not per lead)
- Caching alerts for 1 hour
- Running detector daily, not real-time

**Anti-pattern:**
Don't query historical weather (different API, different format). Active alerts only. The "storm in area" trigger is about NOW, not last month.

---

## Issue 4 — Facebook Page Transparency is genuinely flaky

**What happens:**
Meta has been quietly removing the "Page transparency" feature from many pages since 2023. For pages that still have it, only ~30% list a human admin name (rest show only "United States" or "Owner managed by Facebook").

**Realistic expectations:**
- 60% of pages: no transparency info at all
- 30% of pages: shows country only, no admin name
- 10% of pages: shows actual admin name(s)

**Mitigation:**
1. Build the scraper as best-effort, marked clearly in `source_log`
2. When admin name found → tag with confidence "low" (not "verified")
3. Cross-reference admin name with website "about" page — if match, upgrade confidence to "medium"
4. Skip entirely if Apify FB actor cost > $0.02/lookup (their pricing changes)
5. Settings → "Disable Facebook scraping" toggle for admins who'd rather skip the noise

**Don't:**
- Log into Facebook to get more data (account ban risk)
- Scrape Instagram in same session (cross-platform fingerprinting risk)
- Promise users any specific FB hit rate in the cost estimator — leave it labeled "best effort"

---

## Issue 5 — SMTP email verification has false positives

**What happens:**
The `email-existence` Node package (or any free SMTP probe) returns "deliverable" for catch-all domains. Many small business domains are catch-all (any@domain.com is "valid"). You'll generate emails that look verified but bounce.

**Mitigation:**
1. Detect catch-all domains: send a verification probe to a clearly fake address (`xyz123abc@domain.com`). If that comes back deliverable, the domain is catch-all → flag the verification result as "catch-all, unverified"
2. Tier email confidence:
   - **verified** — SMTP returns 250 OK AND catch-all probe returns 550
   - **likely** — SMTP returns 250 OK AND catch-all probe returns 250 (catch-all domain)
   - **guessed** — no SMTP verify, just pattern match
3. Show confidence badge in lead detail — owner sees and chooses whether to email
4. Default email pattern priority (try in order, accept first verified or likely):
   - `firstname.lastname@`
   - `firstname@`
   - `firstinitiallastname@`
   - `lastname@`
   - `info@`, `contact@`, `hello@` (last resort, generic)

**Don't:**
- Send the verification email itself (that's spam)
- Use the catch-all-flagged email as primary contact without warning

---

## Issue 6 — Forced outcome modal UX needs iteration

**What happens:**
"Forced modal" works in theory. In practice the user will encounter:
- Wrong number dialed → can't escape to redial
- Phone disconnected mid-call → wasn't really "answered"
- User Ctrl+Tab away during call → modal lost
- User wants to call back same lead immediately for missed-info

**Mitigation — escape hatches that don't break the discipline:**
1. Add "I dialed wrong, this isn't really a call" option in Outcome dropdown (separate from `wrong_number` which means the LEAD's number is wrong). This deletes the in-progress attempt rather than logging it.
2. After modal closes, give a 30-second "Undo last outcome" toast — fixes mis-clicks
3. Modal is sticky across tab navigation (rendered in app layout, not page layout)
4. Keyboard shortcuts: 1-7 for outcome dropdown, Tab to next field, Enter to save
5. After call ends, give 2 seconds of "Logging..." before the modal appears — lets user finish typing notes from prior call

**Don't:**
- Add a generic "Skip" button — defeats the purpose
- Allow page navigation while modal is open without confirmation
- Auto-close the modal on inactivity — that's how data gets lost

---

## Issue 7 — NAICS data is incomplete and Eyad needs to download it

**What happens:**
The full 2022 NAICS list has 1,012 six-digit codes. The starter kit only includes a curated ~150-niche shortlist (`supabase/seed/shortlist.csv`). The full list needs to be downloaded.

**Mitigation:**
Eyad downloads the official Excel file ONCE during Phase 1:

1. Go to: `https://www.census.gov/naics/2022NAICS/6-digit_2022_Codes.xlsx`
2. Save as `supabase/seed/naics_codes.csv` after converting to CSV (Excel → Save As CSV)
3. Format should match: `naics_code,name,parent_sector`
4. Run `pnpm run seed:niches` — imports all 1012 rows with `is_shortlist = false`
5. Then run `pnpm run seed:shortlist` — flips `is_shortlist = true` on the 150 in our curated CSV

If census.gov is down or the format changed, fallback to the NAICS Association CSV at `https://www.naics.com/six-digit-naics/` (paid but $0 for the list itself).

**Don't:**
- Generate the NAICS list with AI — accuracy matters for federal/SBA cross-reference
- Skip the seed step — Niche Explorer is unusable without the full taxonomy
- Modify NAICS codes — they're legally defined identifiers

---

## Issue 8 — Recharts polish takes longer than expected

**What happens:**
Recharts works out of the box but the default styling looks generic. Tooltips need formatting (currency, percentages, dates). Color scales need taste. Mobile rendering breaks if not configured.

**Mitigation:**
1. Build all dashboard charts with default styling first — functional but ugly
2. Defer styling polish to Phase 8 final pass
3. Use a shared `chartTheme.ts` file with color tokens matching the app's Tailwind v4 tokens
4. For the heatmap (best time to call): consider using `react-heatmap-2` or manual SVG instead of forcing Recharts into a heatmap pattern
5. Tooltips: always wrap content in custom `<TooltipContent>` component for consistent styling

**Don't:**
- Spend Phase 8 perfecting charts before insights work
- Use a different charting library — Recharts is fine, the issue is taste, not the tool

---

## Issue 9 — Trigger thresholds need real-world tuning

**What happens:**
The spec thresholds (e.g. "review velocity >2x baseline AND ≥3 new reviews") are educated guesses. In practice some triggers will fire too often (review velocity for small-volume businesses with naturally noisy review patterns) and some not enough (storm threshold too strict for non-coastal states).

**Mitigation:**
1. Store thresholds in `pricing_config` table (or a new `trigger_config` table), NOT hardcoded
2. Settings → Trigger Config: admin UI to adjust thresholds per trigger type per niche
3. Auto-tune via simple metric: track `triggers_fired_per_week / leads_monitored`. If a trigger fires for >50% of leads in a month, threshold is too loose. If <2%, too strict. Surface in admin dashboard.
4. First 30 days: leave thresholds at spec defaults, observe
5. After 30 days: review and adjust based on actual data

**Don't:**
- Hardcode thresholds in source
- Auto-adjust thresholds without admin review — algorithm drift makes the system feel unreliable

---

## Issue 10 — Edge cases the spec doesn't cover

**Documented edge cases and decisions:**

### 10a. Same business, multiple Google Maps listings
**Scenario:** "Apex Roofing" has 3 listings — main office, residential branch, commercial branch.

**Decision:** Each unique address creates a separate lead. They share a `parent_business_name` link (add column to leads table in a future migration). Pipeline groups them under one entry with expansion.

Don't dedupe by name alone — different locations have different owners and ops.

### 10b. Same owner runs multiple businesses
**Scenario:** John Smith owns Apex Roofing AND Apex HVAC.

**Decision:** Track at the `owner_name + owner_phone` level. Add `owner_business_count` computed field. Pipeline shows badge "Multi-business owner". Cold-call once per owner across all businesses, not per business.

This is a Phase 9+ refinement, not v1.

### 10c. Lead's phone number changes between generations
**Scenario:** First scrape got (713) 555-1234. Re-scrape 3 months later gets (713) 555-9999 for same business.

**Decision:** Fingerprint changes → would be treated as new lead. Mitigation: re-fingerprint by `(business_name + postal_code)` only (no phone) when checking for "phone-changed dupes." If match found, update phone on existing lead instead of creating new one. Log to `lead_activities` as `phone_updated`.

### 10d. Apollo returns conflicting owner names
**Scenario:** Website says owner is "Mike Smith". Apollo says "Michael R. Smith". SoS registry says "Michael Smith".

**Decision:** Store all variants in `additional_contacts` jsonb. Pick `owner_name` based on source priority:
1. SoS registry (legal name)
2. Website /about page (current preferred name)
3. Apollo (could be outdated)
4. Facebook (least reliable)

### 10e. Business with no website
**Scenario:** Small operators with only a Google Maps listing, no website.

**Decision:** `has_website = false`, skip website scrape entirely. Increase reliance on registry + Facebook + Google search. Don't try to invent a domain for email guessing — mark email as unattainable.

### 10f. Business in a state we don't have a SoS scraper for
**Scenario:** Roofer in Vermont. No VT SoS scraper exists.

**Decision:** Skip registry step gracefully. Log to `source_log` as `"sos_registry: skipped (no scraper for state VT)"`. Fall back harder to website + Facebook + Google search. Don't block the enrichment.

### 10g. Trigger event fires for a lead in `status = 'customer'`
**Scenario:** Customer's location got hit by a hailstorm.

**Decision:** Don't surface in Hot List (the spec already excludes customer status from monitoring). But log to `lead_activities` as `customer_storm_event` — useful for upsell / support outreach (handled in TwentyFour main app, not Lead Engine).

### 10h. Same lead assigned to two team members
**Scenario:** Race condition, both team members mark a lead as `queued` at the same time.

**Decision:** Last write wins on `assigned_to`. Show toast to the losing user: "This lead was just assigned to {other_member} — refreshing your queue." Supabase realtime handles the broadcast.

### 10i. Lead's business hours show "always open" or no hours
**Scenario:** Google Maps shows "Open 24 hours" (towing, locksmith) or no hours at all.

**Decision:** 24/7 → `is_open_now = true` always, `closes_in_seconds = null`. No hours → `is_open_now = null` (unknown), display as "Hours unknown". Don't block calling them — call window restrictions are by US/state TCPA law (8am-9pm local), not by their listed hours.

### 10j. Cost estimator off by >50% from actual
**Scenario:** Estimated $5 generation actually costs $12.

**Decision:** Spec Section 6 says "Pause if running cost exceeds estimate by X%" — implement this. Pause the job, show user "Cost variance detected" modal with the actual vs estimated breakdown. User chooses: resume / cancel / adjust caps. After resume, log discrepancy to `generation_jobs.cost_variance_note` for future estimator tuning.

---

## When in doubt

If Claude Code hits an issue not covered here:
1. Stop and describe the issue to Eyad
2. Propose 2-3 mitigation options with trade-offs
3. Wait for decision
4. After decision, add the issue + decision to this document (`KNOWN_ISSUES.md`) for future reference

This file is living. Every real issue encountered + resolution should be added.

---

**End of known issues.**
