import type { EnrichLead, EnrichedFields } from '@/lib/enrich/types';
import { officerOwnerCandidate, skipLog, successLog, throttleSos } from './shared';
import { parseOfficersFromText, sosPageText } from './playwright-search';

const SEARCH = 'https://bizfileonline.sos.ca.gov/search/business';

export async function searchCa(lead: EnrichLead): Promise<Partial<EnrichedFields>> {
  const start = Date.now();
  await throttleSos();
  try {
    const text = await sosPageText(SEARCH, lead);
    const officers = parseOfficersFromText(text);
    const patch: Partial<EnrichedFields> = {
      business_registration: {
        registry: 'us_sos_ca',
        registry_id: lead.business_name,
        registered_name: lead.business_name,
        officers,
      },
    };
    const owner = officerOwnerCandidate(officers);
    if (owner) patch.owner_name = owner;
    return successLog('us_sos_ca', patch, Date.now() - start);
  } catch (error) {
    return skipLog('us_sos_ca', error instanceof Error ? error.message : 'fail', Date.now() - start);
  }
}
