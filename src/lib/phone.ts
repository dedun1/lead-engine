import {
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

type AppCountry = 'US' | 'CA' | 'UK' | 'AU';

function toLibCountry(code: AppCountry): CountryCode {
  return code === 'UK' ? 'GB' : code;
}

export function normalize(
  raw: string,
  countryCode: AppCountry,
): string | null {
  try {
    const parsed = parsePhoneNumberFromString(raw, toLibCountry(countryCode));
    if (!parsed?.isValid()) return null;
    return parsed.format('E.164');
  } catch {
    return null;
  }
}

export function isLikelyMobile(e164: string): boolean {
  try {
    const parsed = parsePhoneNumberFromString(e164);
    if (!parsed) return false;
    const type = parsed.getType();
    return type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE';
  } catch {
    return false;
  }
}

export function formatForDisplay(e164: string): string {
  try {
    const parsed = parsePhoneNumberFromString(e164);
    if (!parsed) return e164;
    return parsed.formatInternational();
  } catch {
    return e164;
  }
}

export function formatForTelLink(e164: string): string {
  return `tel:${e164}`;
}
