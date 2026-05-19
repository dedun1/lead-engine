import * as cheerio from 'cheerio';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { pickUserAgent } from '@/lib/scrape/user-agents';
import {
  extractEmails,
  extractOwnerNames,
  extractPhones,
  extractSocialLinks,
  pickOwnerEmails,
  splitOwnerName,
} from '@/lib/enrich/extract';
import { fieldsFound, makeLogEntry } from '@/lib/enrich/merge';
import type { EnrichLead, EnrichedFields, EnrichmentSource } from '@/lib/enrich/types';
import { withTimeout } from '@/lib/enrich/timeout';

chromium.use(StealthPlugin());

const PATHS = ['/', '/about', '/about-us', '/team', '/our-team', '/contact', '/contact-us'];
const PAGE_TIMEOUT_MS = 10_000;

function normalizeUrl(website: string): string {
  return website.startsWith('http') ? website : `https://${website}`;
}

async function fetchPageHtml(url: string): Promise<string | null> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ userAgent: pickUserAgent() });
    const page = await context.newPage();
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    await context.close();
    return html;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

async function scrapeWebsite(lead: EnrichLead): Promise<Partial<EnrichedFields>> {
  if (!lead.website) return { source_log: [] };

  const base = normalizeUrl(lead.website);
  const host = new URL(base).origin;
  let combined = '';
  let pagesFetched = 0;

  for (const path of PATHS) {
    try {
      const html = await fetchPageHtml(`${host}${path}`);
      if (html) {
        combined += `\n${html}`;
        pagesFetched += 1;
      }
    } catch {
      // try next path
    }
  }

  const text = cheerio.load(combined).text();
  const emails = pickOwnerEmails(extractEmails(text));
  const phones = extractPhones(text, lead.country ?? 'US');
  const names = extractOwnerNames(text);
  const social = extractSocialLinks(combined);

  const patch: Partial<EnrichedFields> = {
    emails_found: emails,
    phones_found: phones,
    social_links: social,
  };
  if (names[0]) {
    patch.owner_name = names[0];
    Object.assign(patch, splitOwnerName(names[0]));
  }
  if (emails[0] && !lead.owner_email) patch.owner_email = emails[0];

  return {
    ...patch,
    source_log: [
      makeLogEntry(
        'website_scrape',
        fieldsFound(patch).length > 0,
        [...fieldsFound(patch), `pages_fetched:${pagesFetched}`],
        0,
      ),
    ],
  };
}

export const websiteScrapeSource: EnrichmentSource = {
  name: 'website_scrape',
  description: 'Scrape business website for contacts',
  is_free: true,
  applicable_countries: ['US', 'CA', 'UK', 'AU'],
  async enrich(lead) {
    const start = Date.now();
    try {
      const result = await withTimeout(
        scrapeWebsite(lead),
        30_000,
        'website_scrape',
      );
      const log = result.source_log?.[0];
      if (log) log.duration_ms = Date.now() - start;
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'website_scrape failed';
      return {
        source_log: [
          makeLogEntry('website_scrape', false, [], Date.now() - start, msg),
        ],
      };
    }
  },
};
