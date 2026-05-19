/** Strip Arabic / localized Maps label noise from scraped addresses. */

const ARABIC_BLOCK = /[\u0600-\u06FF]/g;

export function addressNeedsLocalizationClean(address: string): boolean {
  return ARABIC_BLOCK.test(address) || address.includes('العنوان');
}

export function cleanLocalizedAddress(address: string): string {
  let s = address.replace(ARABIC_BLOCK, '');
  s = s.replace(/العنوان\s*:/gi, '');
  s = s.replace(/^\s*Address\s*:\s*/i, '');
  return s.replace(/\s+/g, ' ').trim();
}
