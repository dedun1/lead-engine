# Prompt Library — Phases 3-5

Continuation of `BUILD_INSTRUCTIONS.md` section 12. Prompts 1-10 cover Phases 1-2 (Foundation + Niche Explorer). This file covers Prompts 11-30 for Phases 3-5, ending at the **v1 cutover point** — when you can start cold calling for real.

**How to use:**
- Paste each prompt verbatim into Claude Code, in order
- Wait for completion + verification before moving to next prompt
- Each prompt creates one commit
- After every 5 prompts, do a manual smoke test
- If anything is unclear, reference PROJECT_SPEC.md sections noted in each prompt

---

## Phase 3 — Lead Generator Core (Prompts 11-16)

### Prompt 11 — Country / Region / City selector data

```
Build the geo-data layer for the Country/Region/City selector. Reference
PROJECT_SPEC section 10.1.

Create in src/lib/geo/:
- countries.ts — exports list of 4 countries (US, CA, UK, AU) with codes and labels
- regions/us-states.ts — array of 50 states + DC with code/name
- regions/ca-provinces.ts — array of 13 provinces/territories with code/name
- regions/uk-regions.ts — array of UK regions (England's 9 + Scotland + Wales + NI)
- regions/au-states.ts — array of 8 states/territories with code/name
- index.ts — exports getRegionsByCountry(countryCode) helper

Build src/components/lead/GeoSelector.tsx:
- Three cascading shadcn Select components: Country, Region, City (text input, no dropdown)
- Country selection populates Region dropdown
- Region selection enables City input
- All controlled inputs, emits onChange({country, region, city, postalCode})
- City field has a sibling "Postal/Zip code" input (optional)

Use this component in the empty /generator page as a smoke test.
Do NOT call any APIs yet — this is pure UI + data.
```

### Prompt 12 — Google Maps Playwright scraper foundation

```
Build src/lib/scrape/google-maps.ts per PROJECT_SPEC sections 4.1 and 4.2,
and KNOWN_ISSUES.md Issue 1.

Requirements:
- Use playwright-extra with puppeteer-extra-plugin-stealth
- Headless Chromium
- Function signature:
  scrapeGoogleMaps(params: {
    nicheKeyword: string,
    country: string,
    region: string,
    city?: string,
    postalCode?: string,
    maxResults: number
  }): Promise<RawGoogleMapsListing[]>
- Rate limit: 2 seconds between requests minimum, randomized 2-5s
- Rotate user-agent strings (provide a list of 8 modern desktop UAs)
- Max session size: 50 listings per browser instance, then close + reopen
- Extract per listing: business_name, address, phone (raw), website, rating,
  review_count, hours (raw HTML — parse later), latitude, longitude, types[]
- On block detection (captcha visible OR 0 results when expected) → throw
  ScraperBlockedError
- Wrap entire function in try/catch, log to scraper_health table on failure
- Add health_check() function that searches "starbucks new york" and expects ≥3 results
- Export TypeScript types for RawGoogleMapsListing

Do NOT integrate with the UI yet. Build as a standalone module.
Create a CLI test script at scripts/test-google-maps.ts that runs the scraper
manually for verification.
```

### Prompt 13 — Phone normalization + business hours parser

```
Build the data-processing utilities that turn raw scraped data into clean DB rows.

src/lib/phone.ts:
- normalize(rawPhone: string, defaultCountry: string): string — returns E.164
  format using libphonenumber-js. Returns null if invalid.
- isLikelyMobile(e164: string): boolean — uses libphonenumber-js getNumberType
- formatForDisplay(e164: string): string — returns +1 (713) 555-1234 style
- formatForTelLink(e164: string): string — returns tel:+17135551234

src/lib/hours.ts:
- parseGoogleMapsHours(rawHtml: string, timezone: string):
  Returns { hours: BusinessHours, timezone: string } where BusinessHours is:
  Array<{day: 0-6, open: string|null, close: string|null, isClosed: boolean}>
- isOpenNow(hours: BusinessHours, timezone: string): boolean
- closesInSeconds(hours: BusinessHours, timezone: string): number | null
- Use luxon for all timezone math
- Handle edge cases per KNOWN_ISSUES.md 10i: 24-hour, no hours, multi-period days

src/lib/timezone.ts:
- inferTimezoneFromCoords(lat: number, lng: number): string
  Use a static lookup table for US states, CA provinces, UK (single tz), AU
  states. For US, granular by state (Texas = America/Chicago, etc.)

Create scripts/test-utils.ts to manually verify each function with sample data.
```

### Prompt 14 — Fingerprint, dedup, and blocklist check

```
Build src/lib/dedup/ per PROJECT_SPEC section 5 and CLAUDE.md rules 7-9.

src/lib/dedup/fingerprint.ts:
- generateFingerprint(lead: { business_name, business_phone, owner_phone, postal_code }): string
- Use exact algorithm from PROJECT_SPEC section 5.1 — do NOT modify
- Return sha256 hex string
- Unit test inline (manual): export testFingerprint() that runs 5 cases

src/lib/dedup/blocklist.ts:
- isFingerprintBlocked(fingerprint: string): Promise<boolean>
  Queries blocked_fingerprints table
- isFingerprintInLeads(fingerprint: string): Promise<{ exists: boolean, leadId?: string }>
  Queries leads table
- addToBlocklist(params: { fingerprint, business_name, business_phone, city,
  region, country, reason, blocked_by }): Promise<void>
- removeFromBlocklist(fingerprint: string): Promise<void> — admin only

src/lib/dedup/insert-lead.ts:
- insertLeadOrSkip(candidate: NewLeadInput, jobId: string): Promise<{
    status: 'inserted' | 'duplicate_merged' | 'blocked',
    leadId?: string
  }>
- Implements the exact insert flow from PROJECT_SPEC section 5.2
- Increments generation_jobs counters (dedup_skip_count, blocklist_skip_count)
- For duplicates: merges newly-discovered fields if existing field is null
- Wrapped in try/catch with proper error logging

CLAUDE.md rule 8 and 9: ALWAYS check fingerprint and blocklist before insert.
This module is the gatekeeper. Do not bypass it from any other module.
```

### Prompt 15 — Cost estimator

```
Build src/lib/cost/ and the cost estimator UI per PROJECT_SPEC section 6.

src/lib/cost/estimator.ts:
- estimateGenerationCost(params: {
    requestedCount: number,
    enableApolloFallback: boolean,
    enableHunterFallback: boolean,
    enableLushaFallback: boolean,
    sourcesEnabled: string[]
  }): Promise<CostEstimate>
- Returns CostEstimate type with:
  - lineItems: Array<{source, unit, quantity, costPerUnit, total}>
  - estimatedTotal: number
  - estimatedTimeMinutes: number
  - expectedCompletenessPercent: number
- Pulls unit costs from pricing_config table
- Default assumes cheap mode (free sources) unless paid fallback enabled

src/components/lead/CostEstimatorModal.tsx:
- shadcn Dialog with line-item table matching PROJECT_SPEC section 6 example
- Toggle for "Enable paid fallback for partial leads"
- "Cancel" and "Run Generation" buttons
- Shows expected completeness and estimated time
- Respects Settings caps: if estimate > max_estimate_cap → "Run" disabled with
  message "Exceeds your $X cap — adjust in Settings"

Integrate into /generator page: after geo + filter selection, "Estimate cost"
button opens this modal. "Run Generation" button is wired but doesn't do
anything yet (Prompt 16 wires it).
```

### Prompt 16 — Generation runner + "Check city size"

```
Wire the full lead generation flow. This is the moment the tool becomes useful.

src/lib/scrape/google-maps.ts:
- Add checkCitySize(params: { nicheKeyword, country, region, city?, postalCode? })
  : Promise<{ approximateCount: number }>
- Lightweight Google Maps search, counts results without fetching details

src/app/api/generate/route.ts:
- POST endpoint
- Body: { nicheId, country, region, city, postalCode, filters, requestedCount,
  enableApolloFallback, enableHunterFallback, enableLushaFallback }
- Workflow:
  1. Create generation_jobs row with status 'estimating'
  2. Run cost estimator, update job with estimated_cost_usd + breakdown
  3. Set status to 'running', started_at = now
  4. Call scrapeGoogleMaps with maxResults = requestedCount * 1.5 (buffer for
     dedup/blocklist skips)
  5. For each raw listing:
     a. Normalize phone with src/lib/phone.ts
     b. Parse hours with src/lib/hours.ts
     c. Infer timezone from lat/lng
     d. Build NewLeadInput
     e. Call insertLeadOrSkip from src/lib/dedup
     f. If status='inserted', count toward delivered_count
     g. Stop when delivered_count >= requestedCount
  6. Update job with status='completed', completed_at, actual_cost_usd

- Streams progress via Server-Sent Events: each lead inserted emits an event
- Frontend subscribes and updates progress bar

src/components/lead/GenerationProgress.tsx:
- Progress bar with delivered/requested counter
- Per-lead status feed: "Fetched Apex Roofing... saved", "Saved Acme HVAC...",
  "Skipped Premier Roofing (duplicate)", "Skipped Joe's Roofing (blocked)"
- Pause / Cancel buttons (write to generation_jobs.status)

In /generator page:
- Add "Check city size" button next to filters — shows toast with count
- Wire "Run Generation" in cost modal to POST /api/generate
- Show GenerationProgress component during run
- On completion: redirect to /pipeline filtered by the job's results

**END OF PHASE 3 — milestone: you can generate real leads from Google Maps.**
Commit and tag this milestone as `v0.3.0-phase3-complete`.
```

---

## Phase 4 — Free Enrichment Waterfall (Prompts 17-21)

### Prompt 17 — Website scraper for owner info

```
Build src/lib/scrape/website.ts per PROJECT_SPEC section 4.2 (Owner name step 1).

Function: scrapeBusinessWebsite(url: string): Promise<WebsiteScrapeResult>

Strategy:
1. Fetch homepage with reasonable timeout (10s), follow redirects
2. Parse with Cheerio
3. Identify candidate pages to crawl by looking for nav links matching:
   /about, /about-us, /team, /our-team, /our-story, /staff, /contact, /meet
4. Fetch up to 4 candidate pages (avoid infinite crawl)
5. From all pages, extract:
   - All text content
   - All mailto: links → candidate emails
   - All tel: links → candidate phones
   - Social media links (Facebook, Instagram, LinkedIn, X, YouTube)
6. Use Claude Haiku to parse owner names from text:
   Prompt: "Extract the name of the owner, founder, or principal of this
   business from the text below. Return JSON: {owner_name: string|null,
   confidence: 'high'|'medium'|'low', source_quote: string}. Confidence high
   only if explicitly labeled (Owner: John Smith, Founder: Jane Doe).
   Return null if not clearly identifiable."

Return:
  {
    owner_name_candidates: Array<{ name, confidence, source_url, source_quote }>,
    emails_found: string[],
    phones_found: string[],  // raw, normalize externally
    socials_found: Record<'facebook'|'instagram'|'linkedin'|'x'|'youtube', string>,
    pages_crawled: string[],
    error?: string
  }

Wrap in try/catch. Failures return empty result with error string, don't throw.

Cost: ~$0.001 per website (one Haiku call per business). Log to source_log.
```

### Prompt 18 — DuckDuckGo + Companies House + US SoS registries

```
Build the remaining free enrichment sources per PROJECT_SPEC section 4.2.

src/lib/scrape/duckduckgo.ts:
- searchDuckDuckGo(query: string): Promise<{ title, url, snippet }[]>
- Use the HTML interface (https://html.duckduckgo.com/html/) — no API needed
- Parse with Cheerio
- Returns top 10 results
- Used to query "[business name] owner" and "[business name] founder"

src/lib/scrape/companies-house.ts:
- searchCompaniesHouse(businessName: string): Promise<CompaniesHouseResult[]>
- Uses official Companies House API
- API key from environment (COMPANIES_HOUSE_API_KEY)
- Returns array of companies with directors, registered office, status
- UK only (filter by country='UK' in caller)
- Rate limit: 600 requests per 5 minutes — built-in throttle

src/lib/scrape/sos-uk.ts → use companies-house.ts (it's the UK registry)

src/lib/scrape/sos-texas.ts (KNOWN_ISSUES Issue 2 — build TX first):
- searchTexasSOSDirect(businessName: string): Promise<SoSResult[]>
- Returns owner/registered agent name, status, formation date
- Cache results 90 days in a new sos_cache table
- Wrap in try/catch, log failures to scraper_health

Defer FL, CA, NY SoS scrapers to Prompts 22-23 (after the waterfall is wired
end-to-end with just TX).

KNOWN_ISSUES Issue 2 build priority order — follow it.
```

### Prompt 19 — Email pattern generator + SMTP verification

```
Build src/lib/enrich/owner-email.ts per PROJECT_SPEC section 4.2 and
KNOWN_ISSUES.md Issue 5.

Function: findOwnerEmail(params: {
  ownerName: string,
  websiteDomain: string,
  emailsFoundOnSite: string[]
}): Promise<OwnerEmailResult>

Algorithm:
1. First check emailsFoundOnSite for any matching the owner's name (e.g.
   john@domain matches "John Smith"). If found, return with source='website'.
2. If owner name has first + last:
   Generate candidates in this order:
   - firstname.lastname@domain
   - firstname@domain
   - firstinitiallastname@domain
   - lastname@domain
3. For each candidate, run SMTP probe (email-existence package):
   - First, do a catch-all check: probe `xyz999abc${randint}@domain`
   - If catch-all returns deliverable: domain is catch-all → all candidates
     get confidence='likely', not 'verified'
   - If catch-all returns 550/non-existent: probe each candidate
     - 250 OK → confidence='verified'
     - other → skip
4. Return first verified, or first likely if no verified, or null

Return: { email: string|null, confidence: 'verified'|'likely'|'guessed'|null,
  source: 'website'|'pattern_verified'|'pattern_catchall'|'pattern_guess'|null,
  domain_is_catchall: boolean }

Add timeout: 5s per SMTP probe, 30s total budget per lead.
Wrap everything in try/catch. Failures return null with error in source_log.
```

### Prompt 20 — Enrichment waterfall orchestrator

```
Build src/lib/enrich/waterfall.ts — the central orchestrator that runs all
free sources in order per PROJECT_SPEC section 4.2.

Function: enrichLead(leadId: string, options: {
  enableApolloFallback: boolean,
  enableHunterFallback: boolean,
  enableLushaFallback: boolean
}): Promise<EnrichmentResult>

Workflow:
1. Load lead from DB
2. If lead.website: scrape it (Prompt 17)
3. Run DuckDuckGo search for "[business name] owner"
4. Run Companies House (UK) or SoS-Texas (TX) etc. based on lead.country/region
5. Run Facebook Page Transparency if FB URL in socials (defer to Prompt 23)
6. Apply owner-name resolution rules:
   - SoS registry > website /about > Apollo (if enabled) > Facebook
   - Conflicting names → store all in additional_contacts, pick highest-priority
     as primary owner_name
7. If owner_name found AND website domain known: run findOwnerEmail (Prompt 19)
8. Apply owner-phone resolution:
   - If employee_count_estimate < 5: lead.business_phone IS owner phone, label
     "Business Line (likely owner — small operator)"
   - Else if phone found on website /contact different from business_phone:
     that's owner_phone with confidence='likely'
   - Else: owner_phone = null
9. If user opted into paid fallbacks (Phase 11):
   - For missing owner_name → call Apollo (deferred to Phase 11)
   - For missing owner_email → call Hunter
10. Generate Claude Haiku lead summary using PROJECT_SPEC section 13.3 prompt
11. UPDATE leads row with all enriched fields + source_log entries
12. Return EnrichmentResult with summary of what was found and from where

Wire enrichment into /api/generate/route.ts after each lead is inserted:
- After insertLeadOrSkip returns 'inserted', call enrichLead async (don't block
  next lead's scrape)
- Track enrichment status separately from generation status

Add UI indicator in GenerationProgress: "Enriching: 47 of 200 complete..."
```

### Prompt 21 — Source labeling discipline + UI

```
Per PROJECT_SPEC section 4 and CLAUDE.md architecture principle "Source
labeling discipline" — every contact field must show its source visually.

Build src/components/lead/SourceBadge.tsx:
- Props: { source: string, confidence?: 'verified'|'likely'|'guessed' }
- Renders a tiny badge next to the field
- Color-coded:
  - verified: green
  - likely: yellow
  - guessed: orange
- Tooltip on hover shows full source ("From Texas SOSDirect, retrieved 2026-05-14")

Update src/components/lead/LeadDetail.tsx (lead drawer in pipeline):
- Every contact field (owner_name, owner_phone, owner_email, business_phone)
  has a SourceBadge inline
- Hovering field shows the full source_log entry for that field

Add a Settings → AI Prompts page (placeholder for now, full build in Phase 9):
- Just list the 4 hardcoded prompts from PROJECT_SPEC section 13 as read-only
- "Editing prompts requires Phase 9, coming soon"

**END OF PHASE 4 — milestone: leads now have owner names, emails, phones,
summaries — all from free sources. Source labels visible.**
Commit + tag as `v0.4.0-phase4-complete`.
```

---

## Phase 5 — Pipeline + Call Console + Forced Outcome Logging (Prompts 22-30)

### Prompt 22 — Pipeline table

```
Build /pipeline page per PROJECT_SPEC section 10.2 and 11.

src/app/(app)/pipeline/page.tsx:
- Use @tanstack/react-table v8
- Columns: Business, Owner (with SourceBadge), Phone (with SourceBadge), City,
  Rating, Reviews, Status, Last Called, Assigned, Triggers (Phase 7), Actions
- Default sort: newest first (created_at desc)
- Filterable by all of PROJECT_SPEC 10.2 filters
- Filter panel collapsible
- Saved views per user (store in team_members.saved_views jsonb column —
  add migration)
- Multi-select rows for bulk actions
- Bulk actions menu: Assign to..., Change status to..., Export selected as CSV,
  Mark as DNC, Block + Delete

Build src/components/lead/LeadDetailDrawer.tsx:
- Slide-out drawer (shadcn Sheet) opens on row click
- Shows all lead fields with source labels
- Tabs: Overview | Call History | Activity Log | Notes
- "Block + Delete" button at bottom with reason capture modal

Row click: opens detail drawer.
Phone column click: opens Call Console (Prompt 24).

Realtime: subscribe to leads table changes via Supabase Realtime. New leads
or status updates from teammates appear live.
```

### Prompt 23 — Defer to Phase 6 (skip)

```
This slot intentionally left for Phase 6 personalized openers prompt — added
later. Skip and proceed to Prompt 24.
```

### Prompt 24 — Call Console: layout and lead context

```
Build the Call Console per PROJECT_SPEC section 9.1.

src/app/(app)/call-console/[leadId]/page.tsx:
- Full-screen layout (no sidebar visible on this route — clean focus mode)
- Three-column grid: left context (40%), center opener (30%), right cheat sheet (30%)
- Top strip: business name, business phone (huge, tel: link), owner name, city,
  prospect-local-time (auto-updating every second using luxon),
  "Open until X" countdown (using src/lib/hours.ts isOpenNow/closesInSeconds)

Left column components:
- src/components/call-console/BusinessSummary.tsx — ai_summary text
- src/components/call-console/RecentReviews.tsx — last 3 reviews scraped
  (Phase 7 will add fresh scraping; v1 uses stored data from generation)
- src/components/call-console/TriggerEvents.tsx — Phase 7 placeholder, render
  empty card "Triggers coming in Phase 7"
- src/components/call-console/WebsiteAndSocials.tsx — clickable links
- src/components/call-console/PastCallAttempts.tsx — list of prior call_attempts
  for this lead with outcomes and notes

Center column:
- src/components/call-console/OpenerCard.tsx
  - For now: shows a placeholder "Personalized opener loading... (Phase 6)"
  - Manual mode: user can type their own opener
  - Phase 6 will wire in real personalized openers

Right column:
- src/components/call-console/NicheCheatSheet.tsx
  - Loads niche_intelligence + niche_learned_intelligence for this lead's niche
  - Shows: 3 pain points, top 3 objections + your team's best rebuttals
    (rebuttals are Phase 8 — placeholder text for now), avg ticket, pitch angles

Tap business_phone → opens system tel: link AND immediately starts a call
attempt record in state. After click, show "Logging call... click 'End Call'
when done" with a big End Call button.
```

### Prompt 25 — Forced outcome logging modal

```
Build the post-call outcome logging modal per PROJECT_SPEC section 9.2 and
KNOWN_ISSUES.md Issue 6.

This is THE most important UI in the entire app. Do not add a Skip button.
Do not allow Esc to close. Do not allow navigation while open.

src/components/call-console/OutcomeModal.tsx:
- shadcn Dialog with modal={true} (no outside click dismiss)
- onOpenChange disabled (no close until form submitted)
- Steps rendered as visible sections (not multi-page wizard — all on one screen):

  Section 1 - Outcome (required, big buttons):
    [Answered] [Voicemail] [No Answer] [Busy] [Disconnected] [Wrong Number]
    [DNC Requested] [I Dialed Wrong]  ← the escape hatch from KNOWN_ISSUES 10/6

  Section 2 - Result (shown only if Outcome=Answered, required):
    Radio group: Meeting Set | Interested Callback | Not Interested |
    Decision Maker Unavailable | Hostile | Price Objection | Wrong Decision Maker

  Section 3 - Objection (shown only if Result in (Not Interested, Price Objection), required):
    Dropdown: Too expensive | Already have solution | No budget | Too busy |
    Not the owner | Don't trust AI | Language barrier | Offshore concern |
    Wrong timing | No interest | Other...
    If Other: free text field appears

  Section 4 - Notes (optional, textarea, 3 rows)

  Section 5 - Callback (shown only if Result in (Interested Callback, DM Unavailable)):
    Date+time picker (prospect-local-time, default = 3 days from now at 10am their local)
    Note field

  Section 6 - Save buttons (at bottom):
    [Save & Next Lead]
    [Save & Block This Lead] → opens block reason modal first
    [Save & Set Customer]
    [Save & Set Dead]

Logic:
- If Outcome = "I Dialed Wrong": no other fields required, on save → discard
  the in-progress call_attempt entirely (no DB write). Show toast "Discarded —
  redial when ready."
- If Outcome = "DNC Requested": auto-set lead.status = 'dnc' AND add to
  blocklist with reason="DNC requested by prospect"
- Submitting writes:
  - Insert into call_attempts with all fields + prospect_local_hour and
    prospect_local_day computed from lead.timezone
  - Update lead.last_called_at, lead.times_called++
  - If Result=Meeting Set: update lead.status = 'meeting_set'
  - If Result=Hostile: prompt "Add to blocklist?"
- After save: navigate to next lead in queue (if Save & Next), or to selected
  status flow

Keyboard shortcuts (KNOWN_ISSUES 10/6):
- 1-7 selects Outcome
- a-g selects Result (when shown)
- Tab moves between sections
- Cmd/Ctrl+Enter submits

After submit: 30-second "Undo last outcome" toast appears in corner. Clicking
undo restores the previous call_attempt state and reopens the modal.
```

### Prompt 26 — Call Queue mode

```
Build /call-queue page per PROJECT_SPEC section 12.

src/app/(app)/call-queue/page.tsx:
- Sequential one-lead-at-a-time view
- Default queue: leads assigned to current user with status='queued',
  sorted by trigger severity (Phase 7) then by created_at asc
- Can also filter by: niche, region, last_call_outcome
- Big "Next" button advances queue
- Same UI as Call Console but with queue navigation strip at top:
  "12 of 47 in queue — Next leads: Acme Roofing, Premier HVAC, Lone Star Plumbing"

Behavior:
- On open: load current lead into Call Console layout
- After OutcomeModal saves: auto-advance to next lead in queue
- Show queue progress at top
- Allow skip (with reason — "skipping for now") which marks lead with
  status='queued' but adds skipped_at timestamp so it goes to end of queue

Add "Add to queue" button on Pipeline page bulk actions — selected leads get
status='queued' and assigned to whoever clicked.
```

### Prompt 27 — Block + Delete flow

```
Build the block-and-delete flow per PROJECT_SPEC section 5.3.

src/components/lead/BlockLeadModal.tsx:
- Triggered by "Save & Block This Lead" in OutcomeModal OR "Block + Delete"
  in LeadDetailDrawer
- Required dropdown: reason
  Wrong number | Out of business | Rude | Not interested permanently |
  Language barrier | Already a customer | Competitor | Other
- Optional free text for additional context
- Big warning: "This lead will be permanently blocked. They will never appear
  in any future lead generation, even in different cities. You can review
  blocked leads in Settings → Blocklist Review."
- [Cancel] [Block Forever] buttons

On confirm:
- Call addToBlocklist from src/lib/dedup/blocklist.ts
- Update lead.is_blocked = true, blocked_at, blocked_by, blocked_reason
- Lead disappears from all pipeline views immediately (subscribe + refetch)
- Toast: "Lead blocked. 1 of {count_this_month} blocked this month — review
  in Settings."
```

### Prompt 28 — CSV export

```
Build CSV export per PROJECT_SPEC section 16 Phase 5 and section 20 question 4.

src/lib/export/csv.ts:
- exportLeadsToCSV(leadIds: string[], format: 'standard'|'dialer'|'crm'): string
- Standard format columns: business_name, address, city, region, postal_code,
  business_phone, owner_name, owner_phone, owner_email, website, google_rating,
  google_review_count, status, last_called_at, notes, niche_name
- Dialer format: phone columns first (for upload to PhoneBurner / Orum), one
  row per phone (business + owner)
- CRM format: deferred to Phase 11

src/app/api/export/route.ts:
- GET ?format=standard&leadIds=...
- Returns text/csv with appropriate filename
- Bulk export: cap at 5000 rows per export to prevent timeouts

Wire into Pipeline page bulk actions: "Export selected as CSV" dropdown.
Default format: standard. Eyad can pick dialer if integrating with a phone
system.
```

### Prompt 29 — Pipeline filter polish + saved views

```
Polish the Pipeline page filters and add saved views per PROJECT_SPEC 10.2.

src/components/lead/PipelineFilters.tsx:
- All filters from section 10.2 (status, last outcome, last result, objection,
  times called, last called date range, has trigger, assigned to, niche,
  region, city)
- Each filter as a separate shadcn Popover with multi-select
- Active filters shown as badges above the table — click to remove
- "Clear all filters" button
- "Save this view" button — prompts for name, saves to
  team_members.saved_views jsonb (array of {name, filters})
- "Load view" dropdown — switches to a saved view

Wire URL search params: filters serialize to ?status=new,queued&assigned_to=...
so views are linkable and back/forward work correctly.
```

### Prompt 30 — Status management + Pipeline polish

```
Final Phase 5 polish.

src/components/lead/StatusBadge.tsx:
- Color-coded status pill (new=gray, queued=blue, contacted=yellow,
  meeting_set=green, customer=purple, dead=red, dnc=black)

Inline status edit:
- Click status cell in Pipeline → dropdown to change
- Logs to lead_activities as status_changed event
- Realtime broadcast to other team members

Assignment:
- "Assign" column in Pipeline → click to assign to team member dropdown
- Self-assign button on unassigned leads in Call Queue
- Lead can be reassigned, with activity log entry

Empty states for /pipeline:
- No leads at all: "Generate your first leads" with link to /generator
- All leads filtered out: "No leads match your filters — try clearing them"
- Loading: skeleton table rows

Performance:
- Add pagination: 50 leads per page
- Virtualized scrolling for >500 leads using @tanstack/react-virtual
- Server-side filtering (don't load all leads to client and filter there)

**END OF PHASE 5 — V1 CUTOVER POINT.**

At this point you have:
- Working lead generation from Google Maps
- Free enrichment for owner name, email, phone
- Full pipeline with filtering, status tracking, CSV export
- Call Console with structured forced outcome logging
- Call Queue for focused dialing
- Permanent blocklist

**Eyad can now start real cold calling.** Phases 6-11 build on this foundation
but are not required for revenue.

Commit + tag as `v0.5.0-v1-cutover-ready`.
Push tag to GitHub.
Take 2-3 days to actually call 50-100 leads before continuing to Phase 6.
The learnings from those calls will shape what Phase 6 looks like.
```

---

## What comes after Prompt 30

Phases 6-11 are valuable but optional for v1 revenue. After 2-3 weeks of real cold calling, decide which phases to build next based on what's actually slowing you down:

- **Personalized openers a bottleneck?** → Phase 6 (Prompts 31-33)
- **Wasting time on cold leads?** → Phase 7 Hot List (Prompts 34-37)
- **Need to know what's working?** → Phase 8 Learning Dashboard (Prompts 38-40)
- **Blocklist getting messy?** → Phase 9 Blocklist Review (Prompts 41-42)
- **Need real desktop app?** → Phase 10 Electron Wrap (Prompts 43-44)
- **Free sources not enough?** → Phase 11 Paid Fallbacks (Prompts 45-46)

Write those prompts when you reach each phase — by then you'll know what you actually need from real call data.

---

**End of prompt library.**
