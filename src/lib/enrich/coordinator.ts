import { mergeEnrichment, hasStopCriteria } from './merge';
import { withTimeout } from './timeout';
import type { EnrichLead, EnrichedFields } from './types';
import { websiteScrapeSource } from './sources/website-scrape';
import { duckDuckGoSource } from './sources/duckduckgo';
import { usSosSource } from './sources/us-sos';
import { companiesHouseSource } from './sources/companies-house';
import { facebookSource } from './sources/facebook';
import { verifyEmailsInFields } from './sources/smtp-verify';
import { logEnrichmentSourceHealth } from './scraper-health';

const SOURCE_TIMEOUT_MS = 15_000;
const TOTAL_BUDGET_MS = 90_000;

const FREE_SOURCES = [
  websiteScrapeSource,
  duckDuckGoSource,
  usSosSource,
  companiesHouseSource,
  facebookSource,
];

export type EnrichLeadOptions = {
  stopWhenFound?: string[];
};

export async function enrichLead(
  lead: EnrichLead,
  options: EnrichLeadOptions = {},
): Promise<EnrichedFields> {
  const stopWhenFound = options.stopWhenFound ?? ['owner_name', 'owner_email'];
  const started = Date.now();
  let accumulated: EnrichedFields = { source_log: [] };

  const country = lead.country ?? 'US';

  for (const source of FREE_SOURCES) {
    if (Date.now() - started > TOTAL_BUDGET_MS) break;
    if (!source.applicable_countries.includes(country)) continue;

    if (source.name === 'website_scrape' && !lead.website) continue;
    if (source.name === 'duckduckgo' && accumulated.owner_name) {
      continue;
    }
    if (
      source.name === 'us_sos' &&
      accumulated.business_registration
    ) {
      continue;
    }

    try {
      const patch = await withTimeout(
        source.enrich(lead),
        SOURCE_TIMEOUT_MS,
        source.name,
      );
      accumulated = mergeEnrichment(accumulated, patch);
      const ok = (patch.source_log?.[0]?.success) ?? false;
      await logEnrichmentSourceHealth(source.name, ok, patch.source_log?.[0]?.error);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'source failed';
      accumulated.source_log.push({
        source: source.name,
        attempted_at: new Date().toISOString(),
        success: false,
        fields_found: [],
        error: msg,
        duration_ms: SOURCE_TIMEOUT_MS,
      });
      await logEnrichmentSourceHealth(source.name, false, msg);
    }

    if (hasStopCriteria(accumulated, stopWhenFound)) break;
  }

  const emails = accumulated.emails_found ?? [];
  if (emails.length > 0 || accumulated.owner_email) {
    try {
      const verified = await withTimeout(
        verifyEmailsInFields(
          emails.length ? emails : [accumulated.owner_email!],
          accumulated.owner_email ?? lead.owner_email,
        ),
        SOURCE_TIMEOUT_MS,
        'smtp_verify',
      );
      accumulated = mergeEnrichment(accumulated, verified);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'smtp_verify failed';
      accumulated.source_log.push({
        source: 'smtp_verify',
        attempted_at: new Date().toISOString(),
        success: false,
        fields_found: [],
        error: msg,
        duration_ms: 0,
      });
    }
  }

  return accumulated;
}
