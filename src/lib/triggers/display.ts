import type { TriggerType } from './types';
import { TRIGGER_SEVERITY_CLASS } from '@/lib/ui/semantic-classes';

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  review_velocity_spike: 'Review velocity spike',
  recent_negative_review: 'Recent negative review',
  storm_in_area: 'Storm in area',
  new_business_registration: 'New competitor registered',
  website_change: 'Website changed',
  facebook_resurrection: 'Facebook active again',
  google_traffic_spike: 'Review acceleration',
};

export const TRIGGER_WHY: Record<TriggerType, string> = {
  review_velocity_spike:
    'More reviews than usual — owners often care about reputation right now.',
  recent_negative_review:
    'A bad review just landed — reputation pain is a strong automation hook.',
  storm_in_area:
    'Severe weather in their area — timely for weather-sensitive trades.',
  new_business_registration:
    'New competitor filed nearby — urgency to differentiate.',
  website_change:
    'Their site changed — they may be investing in growth or messaging.',
  facebook_resurrection:
    'They posted again after going quiet — marketing may be back on.',
  google_traffic_spike:
    'Review momentum is accelerating — visibility spike worth mentioning.',
};

export function payloadSummary(
  type: TriggerType,
  details: Record<string, unknown> | null,
): string {
  const d = details ?? {};
  switch (type) {
    case 'review_velocity_spike':
      return `+${d.growth_absolute ?? '?'} reviews (${d.growth_pct ?? '?'}%) vs last week`;
    case 'recent_negative_review':
      return `${d.review_rating ?? '?'}★ review: ${String(d.review_text ?? '').slice(0, 80)}`;
    case 'storm_in_area':
      return `${d.event_type ?? 'Storm'} — ${d.event_severity ?? ''}`;
    case 'new_business_registration':
      return `New: ${d.new_competitor_name ?? 'competitor'}`;
    case 'website_change':
      return 'Website content changed since last check';
    case 'facebook_resurrection':
      return `Posted again after dormancy`;
    case 'google_traffic_spike':
      return `${d.acceleration_factor ?? '?'}x review acceleration (30d)`;
    default:
      return 'Active trigger';
  }
}

export const SEVERITY_CLASS: Record<string, string> = TRIGGER_SEVERITY_CLASS;
