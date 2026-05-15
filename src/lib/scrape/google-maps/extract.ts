import type { Page } from 'playwright';
import type { RawGoogleMapsListing } from './types';
import { randomThrottle } from './browser';

export async function scrollResultsFeed(page: Page): Promise<void> {
  const target = page.locator('div[role="feed"]').first();
  await target.evaluate((el: HTMLElement) => {
    el.scrollTop = el.scrollHeight;
  });
  await randomThrottle();
}

export async function extractVisibleListings(
  page: Page,
): Promise<RawGoogleMapsListing[]> {
  const items = page.locator('div[role="feed"] > div > div > a');
  const count = await items.count();
  const listings: RawGoogleMapsListing[] = [];

  for (let i = 0; i < count; i += 1) {
    const link = items.nth(i);
    const label = (await link.getAttribute('aria-label')) ?? '';
    if (!label || label.toLowerCase().includes('sponsored')) continue;

    const card = link;
    const text = (await card.innerText().catch(() => label)) ?? label;
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const name = lines[0] ?? label;
    const ratingMatch = text.match(/(\d\.\d)\s*\(([\d,]+)\)/);
    const rating = ratingMatch ? Number(ratingMatch[1]) : null;
    const review_count = ratingMatch
      ? Number(ratingMatch[2].replace(/,/g, ''))
      : null;

    const href = (await link.getAttribute('href')) ?? '';
    const placeMatch = href.match(/!1s([^!]+)/);
    const coordsMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    listings.push({
      business_name: name,
      address: lines.find((l: string) => /\d/.test(l) && l.length > 8) ?? '',
      phone_raw: null,
      website: null,
      rating,
      review_count,
      hours_raw: lines.find((l: string) => /open|closed|hours/i.test(l)) ?? null,
      lat: coordsMatch ? Number(coordsMatch[1]) : null,
      lng: coordsMatch ? Number(coordsMatch[2]) : null,
      types: [],
      google_place_id: placeMatch?.[1] ?? null,
    });
  }

  return dedupeByName(listings);
}

function dedupeByName(
  rows: RawGoogleMapsListing[],
): RawGoogleMapsListing[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = r.business_name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function countVisibleListings(page: Page): Promise<number> {
  const items = page.locator('div[role="feed"] > div > div > a');
  return items.count();
}

export function bucketCitySize(count: number): number {
  if (count >= 200) return 200;
  if (count >= 100) return 100;
  if (count >= 50) return 50;
  if (count >= 20) return 20;
  if (count >= 10) return 10;
  return count;
}
