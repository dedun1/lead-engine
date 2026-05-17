import { DateTime } from 'luxon';
import type { DetectorResult, EligibleLead, TriggerSeverity } from '../types';

const SOURCE = 'trigger_noaa_storm';
const ALERT_TYPES = [
  'Tornado',
  'Severe Thunderstorm',
  'Hail',
  'Hurricane',
  'Tropical Storm',
  'Flood',
  'Winter Storm',
];

type NoaaFeature = {
  properties: {
    id: string;
    event?: string;
    severity?: string;
    description?: string;
    ends?: string;
  };
};

function mapSeverity(noaa: string | undefined): TriggerSeverity {
  const s = (noaa ?? '').toLowerCase();
  if (s === 'extreme') return 'critical';
  if (s === 'severe') return 'high';
  if (s === 'moderate') return 'medium';
  return 'low';
}

function matchesEventType(event: string): boolean {
  return ALERT_TYPES.some((t) => event.startsWith(t) || event.includes(t));
}

export async function detectStorm(leads: EligibleLead[]): Promise<DetectorResult> {
  const events: DetectorResult['events'] = [];
  const usLeads = leads.filter(
    (l) =>
      l.niche?.weather_sensitive &&
      (l.country === 'US' || l.country == null) &&
      l.region &&
      /^[A-Z]{2}$/i.test(l.region),
  );

  const states = [...new Set(usLeads.map((l) => l.region!.toUpperCase()))];
  const alertsByState = new Map<string, NoaaFeature[]>();

  for (const state of states) {
    try {
      const res = await fetch(
        `https://api.weather.gov/alerts/active/area/${state}`,
        {
          headers: { Accept: 'application/geo+json', 'User-Agent': 'LeadEngine/1.0' },
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (!res.ok) continue;
      const json = (await res.json()) as { features?: NoaaFeature[] };
      alertsByState.set(state, json.features ?? []);
    } catch {
      // skip state on failure
    }
  }

  if (states.length > 0 && alertsByState.size === 0) {
    throw new Error('NOAA fetch failed for all states');
  }

  const now = DateTime.now();

  for (const lead of usLeads) {
    const state = lead.region!.toUpperCase();
    const features = alertsByState.get(state) ?? [];
    for (const f of features) {
      const event = f.properties.event ?? '';
      if (!matchesEventType(event)) continue;
      const ends = f.properties.ends
        ? DateTime.fromISO(f.properties.ends)
        : now.plus({ days: 3 });
      events.push({
        lead_id: lead.id,
        trigger_type: 'storm_in_area',
        severity: mapSeverity(f.properties.severity),
        detected_at: now.toISO()!,
        expires_at: ends.plus({ days: 14 }).toISO(),
        dedupe_key: `storm-${lead.id}-${f.properties.id}`,
        details: {
          event_type: event,
          event_severity: f.properties.severity ?? 'Unknown',
          event_description: (f.properties.description ?? '').slice(0, 500),
          expected_until: f.properties.ends ?? null,
          noaa_alert_id: f.properties.id,
        },
      });
    }
  }

  return { events, leadPatches: [] };
}

export const STORM_SOURCE = SOURCE;
