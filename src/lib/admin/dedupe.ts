import { parsePhoneNumberFromString } from 'libphonenumber-js';

export type DedupeLeadRow = {
  id: string;
  business_name: string;
  fingerprint: string;
  business_phone: string | null;
  website: string | null;
  last_called_at: string | null;
};

export type DedupeGroup = {
  key: string;
  kind: 'phone' | 'website';
  leads: DedupeLeadRow[];
};

export function normalizeWebsite(url: string | null): string | null {
  if (!url?.trim()) return null;
  let s = url.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  return s.replace(/\/$/, '') || null;
}

export function normalizePhone(phone: string | null): string | null {
  if (!phone?.trim()) return null;
  try {
    const p = parsePhoneNumberFromString(phone, 'US');
    return (p?.number ?? phone.replace(/\D/g, '')) || null;
  } catch {
    return phone.replace(/\D/g, '') || null;
  }
}

export function buildDedupeGroups(rows: DedupeLeadRow[]): DedupeGroup[] {
  const phoneMap = new Map<string, DedupeLeadRow[]>();
  const webMap = new Map<string, DedupeLeadRow[]>();

  for (const row of rows) {
    const phone = normalizePhone(row.business_phone);
    if (phone) {
      const list = phoneMap.get(phone) ?? [];
      list.push(row);
      phoneMap.set(phone, list);
    }
    const web = normalizeWebsite(row.website);
    if (web) {
      const list = webMap.get(web) ?? [];
      list.push(row);
      webMap.set(web, list);
    }
  }

  const groups: DedupeGroup[] = [];
  const seen = new Set<string>();

  for (const [key, leads] of phoneMap) {
    const fps = new Set(leads.map((l) => l.fingerprint));
    if (fps.size < 2) continue;
    const id = `phone:${key}`;
    if (seen.has(id)) continue;
    seen.add(id);
    groups.push({ key, kind: 'phone', leads });
  }
  for (const [key, leads] of webMap) {
    const fps = new Set(leads.map((l) => l.fingerprint));
    if (fps.size < 2) continue;
    const id = `web:${key}`;
    if (seen.has(id)) continue;
    seen.add(id);
    groups.push({ key, kind: 'website', leads });
  }
  return groups;
}
