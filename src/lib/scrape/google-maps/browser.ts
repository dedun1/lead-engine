import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'playwright';
import { pickUserAgent } from '@/lib/scrape/user-agents';
import { ScraperBlockedError, ScraperTimeoutError } from '@/lib/scrape/errors';

chromium.use(StealthPlugin());

const NAV_TIMEOUT_MS = 45_000;
const SESSION_CAP = 50;

let sessionCount = 0;
let sharedBrowser: Browser | null = null;

export async function randomThrottle(): Promise<void> {
  const delay = 2000 + Math.random() * 3000;
  await new Promise((r) => setTimeout(r, delay));
}

export async function launchMapsPage(): Promise<{ browser: Browser; page: Page }> {
  if (sessionCount >= SESSION_CAP && sharedBrowser) {
    await sharedBrowser.close().catch(() => undefined);
    sharedBrowser = null;
    sessionCount = 0;
  }

  if (!sharedBrowser) {
    sharedBrowser = await chromium.launch({ headless: true });
    sessionCount = 0;
  }
  sessionCount += 1;

  const context = await sharedBrowser.newContext({
    userAgent: pickUserAgent(),
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(NAV_TIMEOUT_MS);
  return { browser: sharedBrowser, page };
}

export async function closeMapsBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => undefined);
    sharedBrowser = null;
    sessionCount = 0;
  }
}

export async function assertNotBlocked(page: Page): Promise<void> {
  const url = page.url();
  const body = (await page.textContent('body').catch(() => '')) ?? '';
  const lower = body.toLowerCase();
  if (
    url.includes('/sorry/') ||
    lower.includes('unusual traffic') ||
    lower.includes('captcha') ||
    (await page.locator('iframe[src*="recaptcha"]').count()) > 0
  ) {
    throw new ScraperBlockedError();
  }
}

export async function gotoMapsSearch(
  page: Page,
  query: string,
): Promise<void> {
  try {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await assertNotBlocked(page);
    await page.waitForSelector('div[role="feed"]', {
      timeout: NAV_TIMEOUT_MS,
    }).catch(() => {
      throw new ScraperTimeoutError('Results panel did not load');
    });
  } catch (error) {
    if (error instanceof ScraperBlockedError) throw error;
    if (error instanceof ScraperTimeoutError) throw error;
    throw new ScraperTimeoutError(
      error instanceof Error ? error.message : 'Navigation failed',
    );
  }
}
