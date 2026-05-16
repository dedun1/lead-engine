import * as cheerio from 'cheerio';
import { pickUserAgent } from '@/lib/scrape/user-agents';
import {
  extractEmails,
  extractOwnerNames,
  extractPhones,
  pickOwnerEmails,
} from '@/lib/enrich/extract';
import { fieldsFound, makeLogEntry } from '@/lib/enrich/merge';
import type { EnrichLead, EnrichedFields, EnrichmentSource } from '@/lib/enrich/types';

const THROTTLE_MS = 3500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function ddgSearch(query: string): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': pickUserAgent(),
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`DDG status ${res.status}`);
  const html = await res.text();
  if (/captcha|anomaly/i.test(html)) {
    throw new Error('duckduckgo_rate_limit_or_captcha');
  }
  return html;
}

function parseResults(html: string): string {
  const $ = cheerio.load(html);
  const snippets: string[] = [];
  $('.result__snippet, .result__body').each((_, el) => {
    snippets.push($(el).text());
  });
  $('a.result__a').each((_, el) => {
    snippets.push($(el).attr('href') ?? '');
  });
  return snippets.join('\n').slice(0, 8000);
}

async function runDuckDuckGo(lead: EnrichLead): Promise<Partial<EnrichedFields>> {
  const city = lead.city ?? '';
  const queries = [
    `"${lead.business_name}" ${city} owner contact`.trim(),
    `"${lead.business_name}" linkedin`,
    `"${lead.business_name}" ${city} email`.trim(),
  ];

  let combined = '';
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await sleep(THROTTLE_MS);
    try {
      const html = await ddgSearch(queries[i]);
      combined += parseResults(html);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'ddg failed';
      return {
        source_log: [
          makeLogEntry('duckduckgo', false, [], 0, msg),
        ],
      };
    }
  }

  const emails = pickOwnerEmails(extractEmails(combined));
  const phones = extractPhones(combined, lead.country ?? 'US');
  const names = extractOwnerNames(combined);
  const li = combined.match(
    /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i,
  );

  const patch: Partial<EnrichedFields> = {
    emails_found: emails,
    phones_found: phones,
  };
  if (names[0] && !lead.owner_name) patch.owner_name = names[0];
  if (emails[0] && !lead.owner_email) patch.owner_email = emails[0];
  if (li) patch.owner_linkedin_url = li[0];

  return {
    ...patch,
    source_log: [
      makeLogEntry('duckduckgo', fieldsFound(patch).length > 0, fieldsFound(patch), 0),
    ],
  };
}

export const duckDuckGoSource: EnrichmentSource = {
  name: 'duckduckgo',
  description: 'DuckDuckGo HTML search for owner contacts',
  is_free: true,
  applicable_countries: ['US', 'CA', 'UK', 'AU'],
  async enrich(lead) {
    const start = Date.now();
    try {
      const result = await runDuckDuckGo(lead);
      const log = result.source_log?.[0];
      if (log) log.duration_ms = Date.now() - start;
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'duckduckgo failed';
      return {
        source_log: [
          makeLogEntry('duckduckgo', false, [], Date.now() - start, msg),
        ],
      };
    }
  },
};
