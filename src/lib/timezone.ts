import { getCountry, getRegionsByCountry } from '@/lib/geo';

export function inferTimezoneFromCoords(
  _lat: number,
  _lng: number,
  country: string,
  region: string,
): string {
  const regions = getRegionsByCountry(country);
  const match = regions.find((r) => r.code === region);
  if (match) return match.default_timezone_iana;
  return getCountry(country)?.default_timezone_iana ?? 'America/New_York';
}
