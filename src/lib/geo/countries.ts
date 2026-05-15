export type CountryCode = 'US' | 'CA' | 'UK' | 'AU';

export type CountryInfo = {
  code: CountryCode;
  name: string;
  currency: string;
  default_dial_code: string;
  default_timezone_iana: string;
};

export const COUNTRIES: CountryInfo[] = [
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    default_dial_code: '+1',
    default_timezone_iana: 'America/New_York',
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    default_dial_code: '+1',
    default_timezone_iana: 'America/Toronto',
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    default_dial_code: '+44',
    default_timezone_iana: 'Europe/London',
  },
  {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    default_dial_code: '+61',
    default_timezone_iana: 'Australia/Sydney',
  },
];

export function getCountry(code: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
