import * as cheerio from 'cheerio';
import type { DetectorResult, EligibleLead } from '../types';

const SOURCE = 'trigger_new_business_opencorporates';
const SUPPORTED = new Set(['TX', 'CA']);
const JURISDICTION: Record<string, string> = { TX: 'us_tx', CA: 'us_ca' };

type Filing = {
  name: string;
  company_number: string;
  registered_at: string;
  registry_url: string;
};

async function fetchRecentFilings(
  jurisdiction: string,
  keyword: string,
): Promise<Filing[]> {
  const q = encodeURIComponent(keyword);
  const url = `https://opencorporates.com/companies?jurisdiction_code=${jurisdiction}&q=${q}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    headers: { 'User-Agent': 'LeadEngine/1.0' },
  });
  if (!res.ok) throw new Error(`OpenCorporates ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const filings: Filing[] = [];
  $('ul.companies li.company').each((_, el) => {
    const name = $(el).find('a.company').first().text().trim();
    const href = $(el).find('a.company').first().attr('href') ?? '';
    const num = href.split('/').pop() ?? href;
    if (!name) return;
    filings.push({
      name,
      company_number: num,
      registered_at: new Date().toISOString(),
      registry_url: href.startsWith('http') ? href : `https://opencorporates.com${href}`,
    });
  });
  return filings.slice(0, 10);
}

export async function detectNewBusiness(
  leads: EligibleLead[],
): Promise<DetectorResult> {
  const events: DetectorResult['events'] = [];
  const skippedStates = new Set<string>();
  const groups = new Map<string, EligibleLead[]>();

  for (const lead of leads) {
    const st = (lead.region ?? '').toUpperCase();
    if (!SUPPORTED.has(st)) {
      if (st && !skippedStates.has(st)) {
        skippedStates.add(st);
      }
      continue;
    }
    const key = `${st}|${lead.city ?? ''}|${lead.niche_id ?? ''}`;
    const list = groups.get(key) ?? [];
    list.push(lead);
    groups.set(key, list);
  }

  if (skippedStates.size) {
    // logged once per run from coordinator via meta
  }

  for (const [, group] of groups) {
    const sample = group[0]!;
    const st = sample.region!.toUpperCase();
    const jurisdiction = JURISDICTION[st]!;
    const keyword = sample.niche?.name ?? 'business';
    try {
      const filings = await fetchRecentFilings(jurisdiction, keyword);
      for (const filing of filings) {
        for (const lead of group) {
          events.push({
            lead_id: lead.id,
            trigger_type: 'new_business_registration',
            severity: 'medium',
            detected_at: new Date().toISOString(),
            expires_at: null,
            dedupe_key: `new-biz-${lead.id}-${filing.company_number}`,
            details: {
              new_competitor_name: filing.name,
              registered_at: filing.registered_at,
              registry_url: filing.registry_url,
              source: 'opencorporates',
            },
          });
        }
      }
    } catch {
      throw new Error('OpenCorporates fetch failed');
    }
  }

  return { events, leadPatches: [] };
}

export const NEW_BUSINESS_SOURCE = SOURCE;
