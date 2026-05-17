import { createAdminClient } from '@/lib/supabase/admin';
import type { EligibleLead } from './types';
import { parseReviewHistory } from './utils';

/** Leads eligible for trigger detection — PROJECT_SPEC §7.1. */
export async function fetchEligibleLeads(): Promise<EligibleLead[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('leads')
    .select(
      `id, niche_id, business_name, city, region, country, website,
       google_review_count, review_count_history, website_snapshot_hash,
       website_snapshot_at, socials, source_log, latitude, longitude, address,
       niches!inner ( id, name, naics_code, weather_sensitive, is_actively_pitching )`,
    )
    .eq('is_blocked', false)
    .in('status', ['new', 'queued', 'contacted', 'meeting_set'])
    .eq('niches.is_actively_pitching', true);

  if (error || !data) return [];

  return data.map((row) => {
    const niche = row.niches as {
      id: string;
      name: string;
      naics_code: string | null;
      weather_sensitive: boolean | null;
    };
    return {
      id: row.id,
      niche_id: row.niche_id,
      business_name: row.business_name,
      city: row.city,
      region: row.region,
      country: row.country ?? 'US',
      website: row.website,
      google_review_count: row.google_review_count,
      review_count_history: parseReviewHistory(row.review_count_history),
      website_snapshot_hash: row.website_snapshot_hash,
      website_snapshot_at: row.website_snapshot_at,
      socials: (row.socials as Record<string, string>) ?? null,
      source_log: row.source_log,
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
      niche,
    };
  });
}
