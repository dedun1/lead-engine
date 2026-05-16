import type { EnrichLead, EnrichedFields } from '@/lib/enrich/types';
import { officerOwnerCandidate, skipLog, successLog, throttleSos } from './shared';
import { parseOfficersFromText, sosPageText } from './playwright-search';

const SEARCH =
  'https://www.sosnc.gov/online_services/search/Business_Registration';

export async function searchNc(lead: EnrichLead): Promise<Partial<EnrichedFields>> {
  const start = Date.now();
  await throttleSos();
  try {
    const text = await sosPageText(SEARCH, lead);
    const officers = parseOfficersFromText(text);
    const patch: Partial<EnrichedFields> = {
      business_registration: { registry: 'us_sos_nc', registry_id: lead.business_name, officers },
    };
    const owner = officerOwnerCandidate(officers);
    if (owner) patch.owner_name = owner;
    return successLog('us_sos_nc', patch, Date.now() - start);
  } catch (error) {
    return skipLog('us_sos_nc', error instanceof Error ? error.message : 'fail', Date.now() - start);
  }
}
