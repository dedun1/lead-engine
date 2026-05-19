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

const DEFAULT_SOURCE_TIMEOUT_MS = 15_000;
const SOURCE_TIMEOUT_MS: Record<string, number> = {
  website_scrape: 30_000,
};
const TOTAL_BUDGET_MS = 90_000;

function sourceTimeoutMs(sourceName: string): number {
  return SOURCE_TIMEOUT_MS[sourceName] ?? DEFAULT_SOURCE_TIMEOUT_MS;
}

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
      const timeoutMs = sourceTimeoutMs(source.name);
      const patch = await withTimeout(source.enrich(lead), timeoutMs, source.name);
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
        duration_ms: sourceTimeoutMs(source.name),
      });
      await logEnrichmentSourceHealth(source.name, false, msg);
    }

    if (hasStopCriteria(accumulated, stopWhenFound)) break;
  }

  const emails = accumulated.emails_found ?? [];
  const emailToVerify =
    accumulated.owner_email ?? lead.owner_email ?? null;
  if (emails.length > 0 || emailToVerify) {
    try {
      const verified = await withTimeout(
        verifyEmailsInFields(
          emails,
          emailToVerify,
        ),
        DEFAULT_SOURCE_TIMEOUT_MS,
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
