/** Trigger pipeline types — PROJECT_SPEC §7. */

export const TRIGGER_TYPES = [
  'review_velocity_spike',
  'recent_negative_review',
  'storm_in_area',
  'new_business_registration',
  'website_change',
  'facebook_resurrection',
  'google_traffic_spike',
] as const;

export type TriggerType = (typeof TRIGGER_TYPES)[number];

export type TriggerSeverity = 'low' | 'medium' | 'high' | 'critical';

export type EligibleLead = {
  id: string;
  niche_id: string | null;
  business_name: string;
  city: string | null;
  region: string | null;
  country: string | null;
  website: string | null;
  google_review_count: number | null;
  review_count_history: ReviewCountSnapshot[];
  website_snapshot_hash: string | null;
  website_snapshot_at: string | null;
  socials: Record<string, string> | null;
  source_log: unknown;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  niche: {
    id: string;
    name: string;
    naics_code: string | null;
    weather_sensitive: boolean | null;
  } | null;
};

export type ReviewCountSnapshot = { checked_at: string; count: number };

export type TriggerEventDraft = {
  lead_id: string;
  trigger_type: TriggerType;
  severity: TriggerSeverity;
  detected_at: string;
  expires_at: string | null;
  details: Record<string, unknown>;
  dedupe_key: string;
};

export type LeadFieldPatch = {
  id: string;
  review_count_history?: ReviewCountSnapshot[];
  google_review_count?: number;
  website_snapshot_hash?: string;
  website_snapshot_at?: string;
};

export type DetectorResult = {
  events: TriggerEventDraft[];
  leadPatches: LeadFieldPatch[];
};

export type DetectorRunMeta = {
  source: string;
  events: number;
  error?: string;
  skipped?: string;
};
