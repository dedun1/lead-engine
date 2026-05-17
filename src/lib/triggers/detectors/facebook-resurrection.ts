import * as cheerio from 'cheerio';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { DateTime } from 'luxon';
import { pickUserAgent } from '@/lib/scrape/user-agents';
import type { DetectorResult, EligibleLead } from '../types';
import { facebookUrl } from '../utils';

const SOURCE = 'trigger_facebook_resurrection';
const CAP = 25;

chromium.use(StealthPlugin());

function extractPostDates(html: string): DateTime[] {
  const $ = cheerio.load(html);
  const text = $.text();
  const dates: DateTime[] = [];
  const patterns = [
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/gi,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const parsed = DateTime.fromFormat(m[0], 'd MMM yyyy', { locale: 'en' });
      if (parsed.isValid) dates.push(parsed);
    }
  }
  return dates;
}

async function fetchFacebookHtml(url: string): Promise<string | null> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ userAgent: pickUserAgent() });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const html = await page.content();
    const blocked =
      /login|password|captcha|checkpoint/i.test(html) && html.length < 50_000;
    await context.close();
    return blocked ? null : html;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

export async function detectFacebookResurrection(
  leads: EligibleLead[],
): Promise<DetectorResult> {
  const events: DetectorResult['events'] = [];
  const targets = leads.filter((l) => facebookUrl(l)).slice(0, CAP);
  const now = DateTime.now();

  for (const lead of targets) {
    const url = facebookUrl(lead)!;
    try {
      const html = await fetchFacebookHtml(url);
      if (!html) continue;
      const dates = extractPostDates(html).sort((a, b) => b.toMillis() - a.toMillis());
      if (!dates.length) continue;
      const recent = dates[0]!;
      const older = dates[1];
      const dormantUntil = older ?? recent.minus({ days: 90 });
      const daysSinceDormant = now.diff(dormantUntil, 'days').days;
      const daysSinceRecent = now.diff(recent, 'days').days;
      if (daysSinceDormant < 60 || daysSinceRecent > 7) continue;

      events.push({
        lead_id: lead.id,
        trigger_type: 'facebook_resurrection',
        severity: 'low',
        detected_at: now.toISO()!,
        expires_at: null,
        dedupe_key: `fb-resurrection-${lead.id}-${recent.toISODate()}`,
        details: {
          last_dormant_until: dormantUntil.toISO(),
          recent_post_date: recent.toISO(),
        },
      });
    } catch {
      // skip lead
    }
  }

  return { events, leadPatches: [] };
}

export const FACEBOOK_RESURRECTION_SOURCE = SOURCE;
