import type { RegionInfo } from './us-states';

const LONDON = 'Europe/London';

export const UK_REGIONS: RegionInfo[] = [
  { code: 'ENG-NE', name: 'North East England', default_timezone_iana: LONDON },
  { code: 'ENG-NW', name: 'North West England', default_timezone_iana: LONDON },
  { code: 'ENG-YH', name: 'Yorkshire and the Humber', default_timezone_iana: LONDON },
  { code: 'ENG-EM', name: 'East Midlands', default_timezone_iana: LONDON },
  { code: 'ENG-WM', name: 'West Midlands', default_timezone_iana: LONDON },
  { code: 'ENG-EE', name: 'East of England', default_timezone_iana: LONDON },
  { code: 'ENG-SE', name: 'South East England', default_timezone_iana: LONDON },
  { code: 'ENG-SW', name: 'South West England', default_timezone_iana: LONDON },
  { code: 'ENG-LON', name: 'London', default_timezone_iana: LONDON },
  { code: 'SCT', name: 'Scotland', default_timezone_iana: LONDON },
  { code: 'WLS', name: 'Wales', default_timezone_iana: LONDON },
  { code: 'NIR', name: 'Northern Ireland', default_timezone_iana: LONDON },
];
