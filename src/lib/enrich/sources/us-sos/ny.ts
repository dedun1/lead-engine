import type { EnrichLead, EnrichedFields } from '@/lib/enrich/types';
import { officerOwnerCandidate, skipLog, successLog, throttleSos } from './shared';
import { parseOfficersFromText, sosPageText } from './playwright-search';

const SEARCH = 'https://apps.dos.ny.gov/publicInquiry/';

export async function searchNy(lead: EnrichLead): Promise<Partial<EnrichedFields>> {
  const start = Date.now();
  await throttleSos();
  try {
    const text = await sosPageText(SEARCH, lead);
    const officers = parseOfficersFromText(text);
    const patch: Partial<EnrichedFields> = {
      business_registration: {
        registry: 'us_sos_ny',
        registry_id: lead.business_name,
        officers,
      },
    };
    const owner = officerOwnerCandidate(officers);
    if (owner) patch.owner_name = owner;
    return successLog('us_sos_ny', patch, Date.now() - start);
  } catch (error) {
    return skipLog('us_sos_ny', error instanceof Error ? error.message : 'fail', Date.now() - start);
  }
}
