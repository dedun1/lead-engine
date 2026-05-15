import type { RawGoogleMapsListing } from '@/lib/scrape/google-maps/types';
import { normalize as normalizePhone } from '@/lib/phone';
import { parseGoogleMapsHours } from '@/lib/hours';
import { generateFingerprint } from './fingerprint';
import { isFingerprintBlocked } from './blocklist';
import { parsePostalFromAddress } from './parse-postal';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CountryCode } from '@/lib/geo/countries';

export type InsertLeadContext = {
  niche_id: string;
  country: CountryCode;
  region: string;
  city: string;
  timezone: string;
  postal_override?: string | null;
};

export type InsertLeadResult = {
  status: 'inserted' | 'skipped_blocklist' | 'skipped_duplicate';
  lead_id?: string;
  fingerprint: string;
  block_reason?: string | null;
};

export async function insertLeadOrSkip(
  raw: RawGoogleMapsListing,
  context: InsertLeadContext,
): Promise<InsertLeadResult> {
  const postal =
    context.postal_override ??
    parsePostalFromAddress(raw.address, context.country);
  const business_phone = raw.phone_raw
    ? normalizePhone(raw.phone_raw, context.country)
    : null;

  const fingerprint = generateFingerprint({
    business_name: raw.business_name,
    business_phone,
    postal_code: postal,
  });

  if (await isFingerprintBlocked(fingerprint)) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('blocked_fingerprints')
      .select('reason')
      .eq('fingerprint', fingerprint)
      .maybeSingle();
    return {
      status: 'skipped_blocklist',
      fingerprint,
      block_reason: data?.reason ?? null,
    };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('leads')
    .select('id, seen_again_count, website, business_phone, address, google_rating')
    .eq('fingerprint', fingerprint)
    .maybeSingle();

  if (existing) {
    await admin
      .from('leads')
      .update({
        seen_again_count: (existing.seen_again_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
        ...(!existing.website && raw.website ? { website: raw.website } : {}),
        ...(!existing.business_phone && business_phone
          ? { business_phone }
          : {}),
        ...(!existing.address && raw.address ? { address: raw.address } : {}),
        ...(!existing.google_rating && raw.rating
          ? { google_rating: raw.rating }
          : {}),
      })
      .eq('id', existing.id);
    return { status: 'skipped_duplicate', fingerprint, lead_id: existing.id };
  }

  const hours = raw.hours_raw
    ? parseGoogleMapsHours(raw.hours_raw)
    : null;

  const { data: inserted, error } = await admin
    .from('leads')
    .insert({
      niche_id: context.niche_id,
      country: context.country,
      region: context.region,
      city: context.city,
      postal_code: postal,
      business_name: raw.business_name,
      address: raw.address,
      latitude: raw.lat,
      longitude: raw.lng,
      business_phone,
      website: raw.website,
      google_rating: raw.rating,
      google_review_count: raw.review_count,
      business_hours: hours,
      timezone: context.timezone,
      fingerprint,
      source_log: [{ source: 'google_maps_scrape', at: new Date().toISOString() }],
      status: 'new',
    })
    .select('id')
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? 'Insert failed');
  }

  return {
    status: 'inserted',
    lead_id: inserted.id,
    fingerprint,
  };
}
