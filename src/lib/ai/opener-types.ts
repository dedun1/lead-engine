export const HOOK_TYPES = [
  'review_velocity',
  'storm_aftermath',
  'rating_anchor',
  'local_pride',
  'generic_pain_point',
] as const;

export type HookType = (typeof HOOK_TYPES)[number];

export type OpenerGenerationResult = {
  opener_text: string;
  hook_type: HookType;
  personalization_signals_used: string[];
  predicted_open_rate: number;
};

export type OpenerVariantRow = {
  id: string;
  opener_text: string;
  hook_type: string | null;
  predicted_open_rate: number | null;
  personalization_signals_used: string[] | null;
  times_used: number | null;
  meetings_set: number | null;
  conversion_rate: number | null;
  is_personalized: boolean | null;
  is_edited: boolean | null;
  niche_id: string | null;
  lead_id: string | null;
  name: string | null;
};
