import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { pickUserAgent } from '@/lib/scrape/user-agents';
import type { EnrichLead } from '@/lib/enrich/types';

chromium.use(StealthPlugin());

/** Best-effort SoS name search — returns page text for parsing. */
export async function sosPageText(
  searchUrl: string,
  lead: EnrichLead,
): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ userAgent: pickUserAgent() });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    const input = page.locator('input[type="text"], input[name*="name" i]').first();
    if ((await input.count()) > 0) {
      await input.fill(lead.business_name.slice(0, 80));
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }
    const text = (await page.textContent('body')) ?? '';
    await context.close();
    return text;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

export function parseOfficersFromText(text: string): Array<{ name: string; role: string }> {
  const officers: Array<{ name: string; role: string }> = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/president|ceo|manager|member|director|owner/i.test(line) && line.length < 80) {
      const prev = lines[i - 1];
      if (prev && /^[A-Z][a-z]+/.test(prev)) {
        officers.push({ name: prev, role: line });
      }
    }
  }
  return officers.slice(0, 8);
}
