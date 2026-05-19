import type { EnrichedFields, SourceLogEntry } from './types';

export function mergeEnrichment(
  base: EnrichedFields,
  patch: Partial<EnrichedFields>,
): EnrichedFields {
  const next: EnrichedFields = {
    ...base,
    source_log: [...base.source_log],
  };

  if (patch.owner_name && !next.owner_name) next.owner_name = patch.owner_name;
  if (patch.owner_first_name && !next.owner_first_name) {
    next.owner_first_name = patch.owner_first_name;
  }
  if (patch.owner_last_name && !next.owner_last_name) {
    next.owner_last_name = patch.owner_last_name;
  }
  if (patch.owner_email && !next.owner_email) next.owner_email = patch.owner_email;
  if (patch.owner_email_status) {
    next.owner_email_status = preferEmailStatus(
      next.owner_email_status,
      patch.owner_email_status,
    );
  }
  if (patch.owner_linkedin_url && !next.owner_linkedin_url) {
    next.owner_linkedin_url = patch.owner_linkedin_url;
  }
  if (patch.business_registration && !next.business_registration) {
    next.business_registration = patch.business_registration;
  }

  next.emails_found = uniq([...(next.emails_found ?? []), ...(patch.emails_found ?? [])]);
  next.phones_found = uniq([...(next.phones_found ?? []), ...(patch.phones_found ?? [])]);

  if (patch.social_links) {
    next.social_links = { ...next.social_links, ...patch.social_links };
  }

  if (patch.source_log?.length) {
    next.source_log.push(...patch.source_log);
  }

  return next;
}

function uniq(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))];
}

const EMAIL_STATUS_RANK: Record<string, number> = {
  verified: 0,
  risky: 1,
  unverified: 2,
  invalid: 3,
};

/** Prefer stronger verification (verified beats stale unverified). */
export function preferEmailStatus(
  current: EnrichedFields['owner_email_status'],
  incoming: NonNullable<EnrichedFields['owner_email_status']>,
): EnrichedFields['owner_email_status'] {
  if (!current) return incoming;
  const cur = EMAIL_STATUS_RANK[current] ?? 99;
  const inc = EMAIL_STATUS_RANK[incoming] ?? 99;
  return inc <= cur ? incoming : current;
}

export function fieldsFound(patch: Partial<EnrichedFields>): string[] {
  const keys: string[] = [];
  if (patch.owner_name) keys.push('owner_name');
  if (patch.owner_email) keys.push('owner_email');
  if (patch.owner_email_status) keys.push('owner_email_status');
  if (patch.owner_linkedin_url) keys.push('owner_linkedin_url');
  if (patch.emails_found?.length) keys.push('emails_found');
  if (patch.phones_found?.length) keys.push('phones_found');
  if (patch.business_registration) keys.push('business_registration');
  if (patch.social_links && Object.keys(patch.social_links).length) {
    keys.push('social_links');
  }
  return keys;
}

export function makeLogEntry(
  source: string,
  success: boolean,
  fields: string[],
  durationMs: number,
  error?: string,
): SourceLogEntry {
  return {
    source,
    attempted_at: new Date().toISOString(),
    success,
    fields_found: fields,
    error,
    duration_ms: durationMs,
  };
}

export function hasStopCriteria(
  data: EnrichedFields,
  stopWhenFound: string[],
): boolean {
  return stopWhenFound.every((key) => {
    if (key === 'owner_name') return Boolean(data.owner_name);
    if (key === 'owner_email') return Boolean(data.owner_email);
    return Boolean((data as Record<string, unknown>)[key]);
  });
}
