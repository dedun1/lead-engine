import { parsePhoneNumberFromString } from 'libphonenumber-js';

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/gi;
const ROLE_EMAIL_PREFIX =
  /^(info|support|sales|contact|hello|admin|office|noreply|no-reply)@/i;

const OWNER_PATTERNS = [
  /(?:founded|started)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}),?\s+(?:owner|founder|president|ceo)/i,
  /(?:meet|about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*[—–-]\s*(?:founder|owner)/i,
];

export function extractEmails(text: string): string[] {
  const raw = text.match(EMAIL_RE) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of raw) {
    const lower = e.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(lower);
  }
  return out;
}

export function pickOwnerEmails(emails: string[]): string[] {
  const personal = emails.filter((e) => !ROLE_EMAIL_PREFIX.test(e));
  return personal.length ? personal : emails;
}

export function extractPhones(text: string, country = 'US'): string[] {
  const candidates = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g,
  ) ?? [];
  const out: string[] = [];
  for (const raw of candidates) {
    const p = parsePhoneNumberFromString(raw, country as 'US');
    if (p?.isValid()) out.push(p.format('E.164'));
  }
  return [...new Set(out)];
}

export function extractOwnerNames(text: string): string[] {
  const names: string[] = [];
  for (const re of OWNER_PATTERNS) {
    const m = text.match(re);
    if (m?.[1]) names.push(m[1].trim());
  }
  return [...new Set(names)];
}

export function extractSocialLinks(html: string): EnrichedFieldsSocial {
  const links: EnrichedFieldsSocial = {};
  const fb = html.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/i);
  if (fb) links.facebook = fb[0];
  const ig = html.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/i);
  if (ig) links.instagram = ig[0];
  const li = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9._-]+/i);
  if (li) links.linkedin_company = li[0];
  const tw = html.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9._-]+/i);
  if (tw) links.twitter = tw[0];
  return links;
}

type EnrichedFieldsSocial = {
  facebook?: string;
  instagram?: string;
  linkedin_company?: string;
  twitter?: string;
};

export function splitOwnerName(full: string): {
  owner_first_name?: string;
  owner_last_name?: string;
} {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return { owner_first_name: parts[0] };
  return {
    owner_first_name: parts[0],
    owner_last_name: parts.slice(1).join(' '),
  };
}
