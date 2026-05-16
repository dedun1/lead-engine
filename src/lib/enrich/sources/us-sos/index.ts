import type { EnrichLead, EnrichedFields, EnrichmentSource } from '@/lib/enrich/types';
import { leadUsState, skipLog } from './shared';
import { searchCa } from './ca';
import { searchFl } from './fl';
import { searchGa } from './ga';
import { searchIl } from './il';
import { searchMi } from './mi';
import { searchNc } from './nc';
import { searchNy } from './ny';
import { searchOh } from './oh';
import { searchPa } from './pa';
import { searchTx } from './tx';
import { logEnrichmentSourceHealth } from '@/lib/enrich/scraper-health';

const HANDLERS: Record<string, (lead: EnrichLead) => Promise<Partial<EnrichedFields>>> = {
  TX: searchTx,
  FL: searchFl,
  CA: searchCa,
  NY: searchNy,
  PA: searchPa,
  IL: searchIl,
  OH: searchOh,
  GA: searchGa,
  NC: searchNc,
  MI: searchMi,
};

export const usSosSource: EnrichmentSource = {
  name: 'us_sos',
  description: 'US Secretary of State business lookup (top 10 states)',
  is_free: true,
  applicable_countries: ['US'],
  async enrich(lead) {
    const state = leadUsState(lead);
    if (!state) {
      return skipLog('us_sos', 'not_us_or_unknown_state', 0);
    }
    const handler = HANDLERS[state];
    if (!handler) {
      return skipLog('us_sos', `us_sos_not_implemented_for_${state}`, 0);
    }
    const result = await handler(lead);
    const ok = Boolean(result.business_registration);
    await logEnrichmentSourceHealth(`us_sos_${state.toLowerCase()}`, ok);
    return result;
  },
};
