import type { EnrichLead, EnrichedFields } from '@/lib/enrich/types';
import { officerOwnerCandidate, skipLog, successLog, throttleSos } from './shared';
import { parseOfficersFromText, sosPageText } from './playwright-search';

const SEARCH =
  'https://mycpa.cpa.state.tx.us/coa/servlet/coa.WebSrchCorpName';

export async function searchTx(lead: EnrichLead): Promise<Partial<EnrichedFields>> {
  const start = Date.now();
  await throttleSos();
  try {
    const text = await sosPageText(SEARCH, lead);
    const officers = parseOfficersFromText(text);
    const owner = officerOwnerCandidate(officers);
    const patch: Partial<EnrichedFields> = {
      business_registration: {
        registry: 'us_sos_tx',
        registry_id: lead.business_name,
        registered_name: lead.business_name,
        status: /active|in existence/i.test(text) ? 'active' : 'unknown',
        officers,
      },
    };
    if (owner) patch.owner_name = owner;
    return successLog('us_sos_tx', patch, Date.now() - start);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'tx_sos failed';
    return skipLog('us_sos_tx', msg, Date.now() - start);
  }
}
