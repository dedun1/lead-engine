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

export async function scrapeGoogleMaps(
  params: ScrapeSearchParams,
): Promise<RawGoogleMapsListing[]> {
  return withHealth(async () => {
    const max = params.maxResults ?? 50;
    const query = buildMapsQuery(params);
    const { page } = await launchMapsPage();
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
    } finally {
      await page.close().catch(() => undefined);
    }

    if (collected.length === 0) {
      throw new ScraperNoResultsError();
    }
    return collected.slice(0, max);
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
    const ok = rows.length >= 3;
    return {
      ok,
      latency_ms: Date.now() - start,
      error: ok ? undefined : 'Fewer than 3 results',
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
