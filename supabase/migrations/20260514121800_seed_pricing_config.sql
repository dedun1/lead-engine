-- §6 cost-estimator seed data. Directionally accurate USD as of 2026-05.
-- Update via Settings → Pricing Config as upstream prices change.
-- ON CONFLICT DO NOTHING so re-running this migration is idempotent.

insert into public.pricing_config (source, unit, cost_usd, notes) values
  ('google_maps_scrape',      'per_listing',      0,     'self-hosted Playwright + stealth scrape'),
  ('claude_haiku_summary',    'per_lead',         0.001, 'Anthropic Haiku 4.5 — lead summary generation'),
  ('claude_haiku_opener',     'per_opener',       0.002, 'Anthropic Haiku 4.5 — personalized opener generation'),
  ('claude_haiku_niche_card', 'per_niche',        0.005, 'Anthropic Haiku 4.5 — niche intelligence card generation'),
  ('apollo_enrichment',       'per_contact',      0.15,  'Apollo.io people search (paid fallback for missing owner)'),
  ('hunter_email',            'per_lookup',       0.04,  'Hunter.io SMTP-verified email lookup'),
  ('lusha_mobile',            'per_lookup',       0.50,  'Lusha mobile lookup (last-resort high-value targets)'),
  ('serpapi_search',          'per_search',       0.005, 'SerpAPI fallback when DuckDuckGo is blocked'),
  ('apify_gmaps_per_1000',    'per_1000_results', 3,     'Apify Google Maps actor (scraper-down fallback)'),
  ('google_places_details',   'per_lookup',       0.017, 'Official Google Places Details API (emergency fallback)')
on conflict (source) do nothing;
