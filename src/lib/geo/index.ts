import { COUNTRIES, getCountry } from './countries';
import { US_STATES } from './regions/us-states';
import { CA_PROVINCES } from './regions/ca-provinces';
import { UK_REGIONS } from './regions/uk-regions';
import { AU_STATES } from './regions/au-states';
import type { RegionInfo } from './regions/us-states';
import { US_CITIES } from './cities/us';
import { CA_CITIES } from './cities/ca';
import { UK_CITIES } from './cities/uk';
import { AU_CITIES } from './cities/au';

export { COUNTRIES, getCountry };
export type { CountryCode, CountryInfo } from './countries';
export type { RegionInfo } from './regions/us-states';

const CITY_MAPS: Record<string, Record<string, string[]>> = {
  US: US_CITIES,
  CA: CA_CITIES,
  UK: UK_CITIES,
  AU: AU_CITIES,
};

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

/** Cities for a region, population order when curated in static data. */
export function getCitiesByRegion(
  countryCode: string,
  regionCode: string,
): string[] {
  const map = CITY_MAPS[countryCode];
  if (!map) return [];
  return map[regionCode] ? [...map[regionCode]] : [];
}
