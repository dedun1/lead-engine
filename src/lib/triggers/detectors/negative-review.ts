import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { pickUserAgent } from '@/lib/scrape/user-agents';
import type { DetectorResult, EligibleLead } from '../types';
import { googleMapsUrlForLead } from '../utils';

const SOURCE = 'trigger_negative_review';
const CAP = 15;

chromium.use(StealthPlugin());

type ScrapedReview = {
  rating: number;
  text: string;
  dateIso: string | null;
  url: string;
};

function parseReviewsFromHtml(html: string, baseUrl: string): ScrapedReview[] {
  const out: ScrapedReview[] = [];
  const starBlocks = html.matchAll(/aria-label="(\d)\s*star[^"]*"[^>]*>([\s\S]{0,800}?)/gi);
  for (const m of starBlocks) {
    const rating = Number(m[1]);
    if (rating > 2) continue;
    const chunk = m[2] ?? '';
    const text = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
    out.push({
      rating,
      text: text || 'Negative review',
      dateIso: new Date().toISOString(),
      url: `${baseUrl}#review-${out.length}`,
    });
    if (out.length >= 8) break;
  }
  return out;
}

async function scrapeNegativeReviews(
  mapsUrl: string,
): Promise<ScrapedReview[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: pickUserAgent(),
      locale: 'en-US',
      timezoneId: 'America/New_York',
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25_000);
    const reviewsUrl = mapsUrl.includes('?')
      ? `${mapsUrl}&hl=en`
      : `${mapsUrl}?hl=en`;
    await page.goto(reviewsUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const html = await page.content();
    await context.close();
    return parseReviewsFromHtml(html, mapsUrl);
  } finally {
    await browser.close().catch(() => undefined);
  }
}

export async function detectNegativeReview(
  leads: EligibleLead[],
): Promise<DetectorResult> {
  const events: DetectorResult['events'] = [];
  const targets = leads
    .filter((l) => googleMapsUrlForLead(l))
    .slice(0, CAP);

  for (const lead of targets) {
    const url = googleMapsUrlForLead(lead)!;
    try {
      const reviews = await scrapeNegativeReviews(url);
      for (const r of reviews) {
        if (r.rating > 2) continue;
        events.push({
          lead_id: lead.id,
          trigger_type: 'recent_negative_review',
          severity: r.rating <= 1 ? 'high' : 'medium',
          detected_at: new Date().toISOString(),
          expires_at: null,
          dedupe_key: r.url,
          details: {
            review_text: r.text,
            review_rating: r.rating,
            review_date: r.dateIso,
            review_url: r.url,
          },
        });
      }
    } catch {
      // skip lead on scrape failure
    }
  }

  return { events, leadPatches: [] };
}

export const NEGATIVE_REVIEW_SOURCE = SOURCE;
