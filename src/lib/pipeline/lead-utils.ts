import type { WeeklyHours } from '@/lib/hours';
import {
  buildGoogleMapsLink,
  resolveGooglePlaceId,
} from '@/lib/leads/google-maps-link';
import type { LeadDetail } from './types';

export function googleMapsUrl(lead: LeadDetail): string | null {
  const queryText = `${lead.business_name} ${lead.address ?? ''}`.trim();
  const hasPlace = Boolean(resolveGooglePlaceId({ source_log: lead.source_log }));
  const hasGeo =
    lead.latitude != null ||
    lead.longitude != null ||
    Boolean(queryText);
  if (!hasPlace && !hasGeo) return null;
  return buildGoogleMapsLink({
    business_name: lead.business_name,
    address: lead.address,
    latitude: lead.latitude,
    longitude: lead.longitude,
    source_log: lead.source_log,
  });
}

export function leadTypesFromSource(lead: LeadDetail): string[] {
  const log = lead.source_log as unknown;
  if (Array.isArray(log)) {
    for (const entry of log) {
      if (entry && typeof entry === 'object' && 'types' in entry) {
        const types = (entry as { types?: string[] }).types;
        if (Array.isArray(types)) return types;
      }
    }
  }
  return [];
}

export function parseWeeklyHours(
  raw: LeadDetail['business_hours'],
): WeeklyHours | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as WeeklyHours;
}
