import type { RawGoogleMapsListing } from '@/lib/scrape/google-maps/types';
import { parseGoogleMapsHours, isOpenNow } from '@/lib/hours';
import { DateTime } from 'luxon';

export type GenerationFilters = {
  has_website?: 'any' | 'required' | 'not_allowed';
  rating_min?: number;
  rating_max?: number;
  review_count_min?: number;
  review_count_max?: number;
  currently_open?: 'any' | 'open_now' | 'opens_within_2h';
};

/** Permissive defaults — no listing should be filtered until the user opts in. */
export const DEFAULT_GENERATION_FILTERS: GenerationFilters = {
  has_website: 'any',
  currently_open: 'any',
  rating_min: undefined,
  rating_max: undefined,
  review_count_min: undefined,
  review_count_max: undefined,
};

/** Remove "any" / empty values before persisting or applying filters. */
export function stripGenerationFilters(
  filters: GenerationFilters,
): GenerationFilters {
  const out: GenerationFilters = {};
  if (filters.has_website && filters.has_website !== 'any') {
    out.has_website = filters.has_website;
  }
  if (filters.currently_open && filters.currently_open !== 'any') {
    out.currently_open = filters.currently_open;
  }
  if (
    filters.rating_min != null &&
    !Number.isNaN(filters.rating_min) &&
    filters.rating_min > 0
  ) {
    out.rating_min = filters.rating_min;
  }
  if (
    filters.rating_max != null &&
    !Number.isNaN(filters.rating_max) &&
    filters.rating_max < 5
  ) {
    out.rating_max = filters.rating_max;
  }
  if (
    filters.review_count_min != null &&
    !Number.isNaN(filters.review_count_min) &&
    filters.review_count_min > 0
  ) {
    out.review_count_min = filters.review_count_min;
  }
  if (
    filters.review_count_max != null &&
    !Number.isNaN(filters.review_count_max)
  ) {
    out.review_count_max = filters.review_count_max;
  }
  return out;
}

export function countAppliedFilters(filters: GenerationFilters): number {
  let n = 0;
  if (filters.has_website && filters.has_website !== 'any') n += 1;
  if (filters.currently_open && filters.currently_open !== 'any') n += 1;
  if (filters.rating_min != null && filters.rating_min > 0) n += 1;
  if (filters.rating_max != null && filters.rating_max < 5) n += 1;
  if (filters.review_count_min != null && filters.review_count_min > 0) n += 1;
  if (filters.review_count_max != null) n += 1;
  return n;
}

export function applyListingFilters(
  listing: RawGoogleMapsListing,
  filters: GenerationFilters,
  timezone: string,
): { pass: boolean; reason?: string } {
  const hasWebsite = Boolean(listing.website);
  if (filters.has_website === 'required' && !hasWebsite) {
    return { pass: false, reason: 'no_website' };
  }
  if (filters.has_website === 'not_allowed' && hasWebsite) {
    return { pass: false, reason: 'has_website' };
  }

  if (
    filters.rating_min != null &&
    filters.rating_min > 0 &&
    (listing.rating == null || listing.rating < filters.rating_min)
  ) {
    return { pass: false, reason: 'rating_below_min' };
  }
  if (
    filters.rating_max != null &&
    listing.rating != null &&
    listing.rating > filters.rating_max
  ) {
    return { pass: false, reason: 'rating_above_max' };
  }

  if (
    filters.review_count_min != null &&
    filters.review_count_min > 0 &&
    (listing.review_count == null ||
      listing.review_count < filters.review_count_min)
  ) {
    return { pass: false, reason: 'reviews_below_min' };
  }
  if (
    filters.review_count_max != null &&
    listing.review_count != null &&
    listing.review_count > filters.review_count_max
  ) {
    return { pass: false, reason: 'reviews_above_max' };
  }

  if (filters.currently_open && filters.currently_open !== 'any') {
    if (!listing.hours_raw) {
      return { pass: false, reason: 'hours_unknown' };
    }
    const hours = parseGoogleMapsHours(listing.hours_raw);
    const open = isOpenNow(hours, timezone);
    if (filters.currently_open === 'open_now' && !open) {
      return { pass: false, reason: 'not_open_now' };
    }
    if (filters.currently_open === 'opens_within_2h' && open) {
      return { pass: true };
    }
    if (filters.currently_open === 'opens_within_2h' && !open) {
      const soon = opensWithinHours(hours, timezone, 2);
      if (!soon) return { pass: false, reason: 'not_opening_soon' };
    }
  }

  return { pass: true };
}

function opensWithinHours(
  hours: ReturnType<typeof parseGoogleMapsHours>,
  timezone: string,
  withinHours: number,
): boolean {
  const now = DateTime.now().setZone(timezone);
  const limit = now.plus({ hours: withinHours });
  for (let i = 0; i < withinHours * 4; i += 1) {
    const probe = now.plus({ minutes: i * 15 });
    if (probe > limit) break;
    const key = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ][probe.weekday - 1]!;
    const day = hours[key];
    if (day === '24_7') return true;
    if (day === 'closed' || !day?.length) continue;
    const t = probe.toFormat('HH:mm');
    if (day.some((r) => r.open <= t && t <= r.close)) return true;
  }
  return false;
}
