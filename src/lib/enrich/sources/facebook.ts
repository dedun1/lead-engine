import * as cheerio from 'cheerio';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { pickUserAgent } from '@/lib/scrape/user-agents';
import { extractEmails } from '@/lib/enrich/extract';
import { fieldsFound, makeLogEntry } from '@/lib/enrich/merge';
import {
  isEnrichmentSourceDisabled,
  logEnrichmentSourceHealth,
} from '@/lib/enrich/scraper-health';
import type { EnrichLead, EnrichedFields, EnrichmentSource } from '@/lib/enrich/types';

chromium.use(StealthPlugin());

const SOURCE = 'facebook_enrichment';

function facebookUrl(lead: EnrichLead): string | null {
  const socials = lead.socials ?? {};
  if (socials.facebook) return socials.facebook;
  return null;
}

async function scrapeFacebookPage(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ userAgent: pickUserAgent() });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const html = await page.content();
    await context.close();
    return html;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

export const facebookSource: EnrichmentSource = {
  name: 'facebook_page',
  description: 'Facebook page transparency / about scrape',
  is_free: true,
  applicable_countries: ['US', 'CA', 'UK', 'AU'],
  async enrich(lead) {
    const start = Date.now();
    if (await isEnrichmentSourceDisabled(SOURCE)) {
      return {
        source_log: [
          makeLogEntry(
            'facebook_page',
            false,
            [],
            Date.now() - start,
            'facebook_source_disabled',
          ),
        ],
      };
    }

    const url = facebookUrl(lead);
    if (!url) {
      return {
        source_log: [
          makeLogEntry('facebook_page', false, [], Date.now() - start, 'no_facebook_url'),
        ],
      };
    }

    try {
      const html = await scrapeFacebookPage(url);
      const text = cheerio.load(html).text();
      const emails = extractEmails(text);
      const patch: Partial<EnrichedFields> = {
        emails_found: emails,
        social_links: { facebook: url },
      };
      if (emails[0] && !lead.owner_email) patch.owner_email = emails[0];

      await logEnrichmentSourceHealth(SOURCE, fieldsFound(patch).length > 0);
      return {
        ...patch,
        source_log: [
          makeLogEntry(
            'facebook_page',
            fieldsFound(patch).length > 0,
            fieldsFound(patch),
            Date.now() - start,
          ),
        ],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'facebook failed';
      const { disabled } = await logEnrichmentSourceHealth(SOURCE, false, msg);
      return {
        source_log: [
          makeLogEntry(
            'facebook_page',
            false,
            [],
            Date.now() - start,
            disabled ? 'facebook_disabled_after_failures' : msg,
          ),
        ],
      };
    }
  },
};
