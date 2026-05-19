import type { Page } from 'playwright';
import { cleanLocalizedAddress } from '@/lib/leads/address-clean';
import type { RawGoogleMapsListing } from './types';
import { randomThrottle } from './browser';

const DETAIL_WAIT_MS = 8000;
const CARD_SELECTOR = 'div[role="feed"] > div > div > a';

function stripPrefix(text: string, prefixes: string[]): string {
  let s = text.trim();
  for (const p of prefixes) {
    if (s.toLowerCase().startsWith(p.toLowerCase())) {
      s = s.slice(p.length).trim();
    }
  }
  return s;
}

function parseWebsiteHref(href: string | null): string | null {
  if (!href) return null;
  try {
    const absolute = href.startsWith('/url?')
      ? `https://www.google.com${href}`
      : href;
    const u = new URL(absolute);
    if (u.hostname.includes('google.') && u.pathname === '/url') {
      const target = u.searchParams.get('q') ?? u.searchParams.get('url');
      return target ? decodeURIComponent(target) : null;
    }
    if (u.hostname.includes('google.com') && !u.hostname.includes('googleusercontent')) {
      if (u.pathname.startsWith('/maps') || u.pathname === '/search') return null;
    }
    return absolute;
  } catch {
    return href.startsWith('http') ? href : null;
  }
}

async function clickListingCard(
  page: Page,
  listing: RawGoogleMapsListing,
  listingIndex: number,
): Promise<void> {
  const items = page.locator(CARD_SELECTOR);
  const count = await items.count();
  for (let j = 0; j < count; j += 1) {
    const link = items.nth(j);
    const label = (await link.getAttribute('aria-label').catch(() => null)) ?? '';
    if (label.toLowerCase().includes('sponsored')) continue;
    if (
      label === listing.business_name ||
      label.startsWith(`${listing.business_name},`) ||
      label.startsWith(`${listing.business_name} `)
    ) {
      await randomThrottle();
      await link.click();
      return;
    }
  }
  await randomThrottle();
  await items.nth(listingIndex).click();
}

async function tryCloseDetailPanel(page: Page): Promise<void> {
  try {
    await page
      .locator(
        'button[jsaction*="pane.topappbar.back"], button[aria-label="Close"]',
      )
      .first()
      .click({ timeout: 2000 });
  } catch {
    // next card click replaces the panel
  }
}

async function extractPhone(page: Page): Promise<string | null> {
  const btn = page.locator('button[data-item-id^="phone:"]').first();
  const label = await btn.getAttribute('aria-label', { timeout: 1500 });
  if (!label) return null;
  return stripPrefix(label, ['Phone:', 'Phone']) || null;
}

async function extractWebsite(page: Page): Promise<string | null> {
  const link = page.locator('a[data-item-id="authority"]').first();
  const href = await link.getAttribute('href', { timeout: 1500 });
  return parseWebsiteHref(href);
}

async function extractAddress(page: Page): Promise<string | null> {
  const btn = page.locator('button[data-item-id="address"]').first();
  const label = await btn.getAttribute('aria-label', { timeout: 1500 });
  if (!label) return null;
  const raw = stripPrefix(label, ['Address:', 'Address']) || null;
  return raw ? cleanLocalizedAddress(raw) : null;
}

async function extractHours(page: Page): Promise<string | null> {
  const hoursDiv = page.locator('div[aria-label*="Hours"]').first();
  const text = await hoursDiv.innerText({ timeout: 1500 }).catch(() => null);
  if (text?.trim()) return text.trim();
  const fallback = page.locator('[data-item-id*="oh"]').first();
  const fb = await fallback.innerText({ timeout: 1500 }).catch(() => null);
  return fb?.trim() ?? null;
}

async function extractTypes(page: Page): Promise<string[]> {
  let raw: string | null = null;
  try {
    raw = await page
      .locator('button[jsaction*="category"]')
      .first()
      .innerText({ timeout: 1500 });
  } catch {
    raw = await page
      .locator('button[jsaction*="pane.rating.category"]')
      .first()
      .innerText({ timeout: 1500 })
      .catch(() => null);
  }
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Opens the Maps detail panel for one listing and merges phone/website/hours/address/types. */
export async function enrichListingFromDetailPanel(
  page: Page,
  listing: RawGoogleMapsListing,
  listingIndex: number,
): Promise<RawGoogleMapsListing> {
  try {
    await clickListingCard(page, listing, listingIndex);
    const opened = await page
      .waitForSelector(
        'button[data-item-id^="phone:"], button[data-item-id="authority"], h1.DUwDvf',
        { timeout: DETAIL_WAIT_MS },
      )
      .catch(() => null);
    if (!opened) {
      console.warn(
        `[google-maps] detail panel did not open for "${listing.business_name}" within ${DETAIL_WAIT_MS}ms`,
      );
      return listing;
    }
  } catch (error) {
    console.warn(
      `[google-maps] detail panel click failed for "${listing.business_name}":`,
      error instanceof Error ? error.message : error,
    );
    return listing;
  }

  const merged = { ...listing };

  try {
    const phone = await extractPhone(page);
    if (phone) merged.phone_raw = phone;
  } catch {
    /* keep sidebar value */
  }
  try {
    const website = await extractWebsite(page);
    if (website) merged.website = website;
  } catch {
    /* keep sidebar value */
  }
  try {
    const address = await extractAddress(page);
    if (address && address.length > (merged.address?.length ?? 0)) {
      merged.address = address;
    }
  } catch {
    /* keep sidebar value */
  }
  try {
    const hours = await extractHours(page);
    if (hours) merged.hours_raw = hours;
  } catch {
    /* keep sidebar value */
  }
  try {
    const types = await extractTypes(page);
    if (types.length) merged.types = types;
  } catch {
    /* keep sidebar value */
  }

  await tryCloseDetailPanel(page);
  return merged;
}
