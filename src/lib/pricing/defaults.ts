/** Seed values from migration 20260514121800_seed_pricing_config.sql */
export const PRICING_CONFIG_DEFAULTS = [
  {
    source: 'google_maps_scrape',
    unit: 'per_listing',
    cost_usd: 0,
    notes: 'self-hosted Playwright + stealth scrape',
  },
  {
    source: 'claude_haiku_summary',
    unit: 'per_lead',
    cost_usd: 0.001,
    notes: 'Anthropic Haiku 4.5 — lead summary generation',
  },
  {
    source: 'claude_haiku_opener',
    unit: 'per_opener',
    cost_usd: 0.002,
    notes: 'Anthropic Haiku 4.5 — personalized opener generation',
  },
  {
    source: 'claude_haiku_niche_card',
    unit: 'per_niche',
    cost_usd: 0.005,
    notes: 'Anthropic Haiku 4.5 — niche intelligence card generation',
  },
  {
    source: 'apollo_enrichment',
    unit: 'per_contact',
    cost_usd: 0.15,
    notes: 'Apollo.io people search (paid fallback for missing owner)',
  },
  {
    source: 'hunter_email',
    unit: 'per_lookup',
    cost_usd: 0.04,
    notes: 'Hunter.io SMTP-verified email lookup',
  },
  {
    source: 'lusha_mobile',
    unit: 'per_lookup',
    cost_usd: 0.5,
    notes: 'Lusha mobile lookup (last-resort high-value targets)',
  },
  {
    source: 'serpapi_search',
    unit: 'per_search',
    cost_usd: 0.005,
    notes: 'SerpAPI fallback when DuckDuckGo is blocked',
  },
  {
    source: 'apify_gmaps_per_1000',
    unit: 'per_1000_results',
    cost_usd: 3,
    notes: 'Apify Google Maps actor (scraper-down fallback)',
  },
  {
    source: 'google_places_details',
    unit: 'per_lookup',
    cost_usd: 0.017,
    notes: 'Official Google Places Details API (emergency fallback)',
  },
] as const;
