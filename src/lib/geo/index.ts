import { COUNTRIES, getCountry } from './countries';
import { US_STATES } from './regions/us-states';
import { CA_PROVINCES } from './regions/ca-provinces';
import { UK_REGIONS } from './regions/uk-regions';
import { AU_STATES } from './regions/au-states';
import type { RegionInfo } from './regions/us-states';

export { COUNTRIES, getCountry };
export type { CountryCode, CountryInfo } from './countries';
export type { RegionInfo } from './regions/us-states';

export function getRegionsByCountry(code: string): RegionInfo[] {
  switch (code) {
    case 'US':
      return US_STATES;
    case 'CA':
      return CA_PROVINCES;
    case 'UK':
      return UK_REGIONS;
    case 'AU':
      return AU_STATES;
    default:
      return [];
  }
}
