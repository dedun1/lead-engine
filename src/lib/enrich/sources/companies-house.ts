import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt, CryptoError } from '@/lib/crypto';
import { fieldsFound, makeLogEntry } from '@/lib/enrich/merge';
import type { EnrichLead, EnrichedFields, EnrichmentSource } from '@/lib/enrich/types';

async function getCompaniesHouseKey(): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('api_keys')
      .select('encrypted_value')
      .eq('service', 'companies_house')
      .maybeSingle();
    if (!data?.encrypted_value) return null;
    return decrypt(data.encrypted_value);
  } catch {
    return null;
  }
}

async function chFetch(path: string, apiKey: string): Promise<Response> {
  const auth = Buffer.from(`${apiKey}:`).toString('base64');
  return fetch(`https://api.company-information.service.gov.uk${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
}

export async function runCompaniesHouse(
  lead: EnrichLead,
): Promise<Partial<EnrichedFields>> {
  const start = Date.now();
  const apiKey = await getCompaniesHouseKey();
  if (!apiKey) {
    return {
      source_log: [
        makeLogEntry(
          'companies_house',
          false,
          [],
          Date.now() - start,
          'companies_house_key_missing',
        ),
      ],
    };
  }

  try {
    const q = encodeURIComponent(lead.business_name);
    const searchRes = await chFetch(
      `/search/companies?q=${q}&items_per_page=5`,
      apiKey,
    );
    if (!searchRes.ok) throw new Error(`search ${searchRes.status}`);
    const searchJson = (await searchRes.json()) as {
      items?: Array<{ company_number: string; title: string; company_status?: string }>;
    };
    const best = searchJson.items?.[0];
    if (!best) {
      return {
        source_log: [
          makeLogEntry('companies_house', false, [], Date.now() - start, 'no_match'),
        ],
      };
    }

    const offRes = await chFetch(
      `/company/${best.company_number}/officers`,
      apiKey,
    );
    const offJson = offRes.ok
      ? ((await offRes.json()) as {
          items?: Array<{ name: string; officer_role: string }>;
        })
      : { items: [] };

    const officers =
      offJson.items?.map((o) => ({
        name: o.name,
        role: o.officer_role,
      })) ?? [];

    const director = officers.find((o) =>
      /director|managing/i.test(o.role),
    );

    const patch: Partial<EnrichedFields> = {
      business_registration: {
        registry: 'companies_house_uk',
        registry_id: best.company_number,
        registered_name: best.title,
        status: best.company_status,
        officers,
      },
    };
    if (director && !lead.owner_name) patch.owner_name = director.name;

    return {
      ...patch,
      source_log: [
        makeLogEntry(
          'companies_house',
          fieldsFound(patch).length > 0,
          fieldsFound(patch),
          Date.now() - start,
        ),
      ],
    };
  } catch (error) {
    const msg =
      error instanceof CryptoError
        ? 'companies_house_key_missing'
        : error instanceof Error
          ? error.message
          : 'companies_house failed';
    return {
      source_log: [
        makeLogEntry('companies_house', false, [], Date.now() - start, msg),
      ],
    };
  }
}

export const companiesHouseSource: EnrichmentSource = {
  name: 'companies_house',
  description: 'UK Companies House API',
  is_free: true,
  applicable_countries: ['UK', 'GB'],
  async enrich(lead) {
    if (lead.country !== 'UK' && lead.country !== 'GB') return { source_log: [] };
    return runCompaniesHouse(lead);
  },
};
