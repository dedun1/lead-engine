/** Build Google Maps URLs — place_id opens the business panel; coords alone do not. */

export function resolveGooglePlaceId(lead: {
  google_place_id?: string | null;
  source_log?: unknown;
}): string | null {
  if (lead.google_place_id) return lead.google_place_id;
  const log = lead.source_log;
  if (!Array.isArray(log)) return null;
  for (const entry of log) {
    if (entry && typeof entry === 'object' && 'google_place_id' in entry) {
      const id = (entry as { google_place_id?: string }).google_place_id;
      if (id) return id;
    }
  }
  return null;
}

export function buildGoogleMapsLink(lead: {
  google_place_id?: string | null;
  source_log?: unknown;
  business_name: string;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}): string {
  const placeId = resolveGooglePlaceId(lead);
  const lat = lead.lat ?? lead.latitude ?? null;
  const lng = lead.lng ?? lead.longitude ?? null;
  const queryText = `${lead.business_name} ${lead.address ?? ''}`.trim();

  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
  }
  if (lat != null && lng != null && queryText) {
    const query = encodeURIComponent(queryText);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
  if (queryText) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;
  }
  return `https://www.google.com/maps`;
}
