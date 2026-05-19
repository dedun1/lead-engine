import type { Page } from 'playwright';
import {
  closeMapsBrowser,
  gotoMapsSearch,
  launchMapsPage,
  assertNotBlocked,
} from './browser';
export { closeMapsBrowser };
import {
  bucketCitySize,
  countVisibleListings,
  extractVisibleListings,
  scrollResultsFeed,
} from './extract';
import { enrichListingFromDetailPanel } from './extract-detail';
import {
  buildMapsQuery,
  type RawGoogleMapsListing,
  type ScrapeSearchParams,
} from './types';
import { logScraperHealth } from '@/lib/scrape/health-log';
import {
  ScraperBlockedError,
  ScraperNoResultsError,
  ScraperTimeoutError,
} from '@/lib/scrape/errors';

export type { RawGoogleMapsListing, ScrapeSearchParams };
export { ScraperBlockedError, ScraperNoResultsError, ScraperTimeoutError };

const ENRICH_CAP = 30;
/** ~7s per listing (panel wait + throttle); health check uses 5 listings. */
const SCRAPE_TIMEOUT_MS = 120_000;

async function withHealth<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    await logScraperHealth({ ok: true, latency_ms: Date.now() - start });
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Scrape failed';
    await logScraperHealth({
      ok: false,
      error: message,
      latency_ms: Date.now() - start,
    });
    throw error;
  }
}

async function enrichCollectedListings(
  page: Page,
  collected: RawGoogleMapsListing[],
  max: number,
): Promise<RawGoogleMapsListing[]> {
  const slice = collected.slice(0, max);
  const enrichCount = Math.min(slice.length, ENRICH_CAP);
  if (slice.length > ENRICH_CAP) {
    console.warn(
      `[google-maps] Enrichment capped at ${ENRICH_CAP}; ${slice.length - ENRICH_CAP} listings remain sidebar-only`,
    );
  }
  console.log(
    `[google-maps] Enriching ${enrichCount} listings via detail panel (est ${enrichCount * 7}s)`,
  );

  const enriched: RawGoogleMapsListing[] = [];
  for (let i = 0; i < slice.length; i += 1) {
    if (i < enrichCount) {
      try {
        enriched.push(await enrichListingFromDetailPanel(page, slice[i], i));
      } catch {
        enriched.push(slice[i]);
      }
    } else {
      enriched.push(slice[i]);
    }
  }
  return enriched;
}

export async function scrapeGoogleMaps(
  params: ScrapeSearchParams,
): Promise<RawGoogleMapsListing[]> {
  return withHealth(async () => {
    const max = params.maxResults ?? 50;
    const query = buildMapsQuery(params);
    const { page } = await launchMapsPage();
    page.setDefaultTimeout(SCRAPE_TIMEOUT_MS);
    const collected: RawGoogleMapsListing[] = [];

    try {
      await gotoMapsSearch(page, query);
      while (collected.length < max) {
        await assertNotBlocked(page);
        const batch = await extractVisibleListings(page);
        for (const row of batch) {
          if (collected.length >= max) break;
          if (!collected.some((c) => c.business_name === row.business_name)) {
            collected.push(row);
          }
        }
        if (collected.length >= max) break;
        const before = await countVisibleListings(page);
        await scrollResultsFeed(page);
        const after = await countVisibleListings(page);
        if (after <= before) break;
      }

      if (collected.length === 0) {
        throw new ScraperNoResultsError();
      }

      return await enrichCollectedListings(page, collected, max);
    } finally {
      await page.close().catch(() => undefined);
    }
  });
}

export async function healthCheck(): Promise<{
  ok: boolean;
  latency_ms: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const rows = await scrapeGoogleMaps({
      nicheKeyword: 'starbucks',
      country: 'US',
      region: 'NY',
      city: 'New York',
      maxResults: 5,
    });
    const withPhone = rows.filter((r) => r.phone_raw).length;
    const ok = rows.length >= 3;
    return {
      ok,
      latency_ms: Date.now() - start,
      error: ok
        ? undefined
        : `Fewer than 3 results (${withPhone} with phone)`,
    };
  } catch (error) {
    return {
      ok: false,
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Health check failed',
    };
  } finally {
    await closeMapsBrowser();
  }
}

export async function checkCitySize(
  params: ScrapeSearchParams,
): Promise<{ estimated_count: number; sampled_at: string }> {
  return withHealth(async () => {
    const query = buildMapsQuery(params);
    const { page } = await launchMapsPage();
    try {
      await gotoMapsSearch(page, query);
      await scrollResultsFeed(page);
      const count = await countVisibleListings(page);
      return {
        estimated_count: bucketCitySize(count),
        sampled_at: new Date().toISOString(),
      };
    } finally {
      await page.close().catch(() => undefined);
    }
  });
}
