import type { WeeklyHours } from '@/lib/hours';
import type { LeadDetail } from './types';

export function googleMapsUrl(lead: LeadDetail): string | null {
  const log = lead.source_log as unknown;
  if (Array.isArray(log)) {
    for (const entry of log) {
      if (entry && typeof entry === 'object' && 'google_place_id' in entry) {
        const id = (entry as { google_place_id?: string }).google_place_id;
        if (id) {
          return `https://www.google.com/maps/place/?q=place_id:${id}`;
        }
      }
    }
  }
  if (lead.latitude != null && lead.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lead.latitude},${lead.longitude}`;
  }
  if (lead.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`;
  }
  return null;
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
