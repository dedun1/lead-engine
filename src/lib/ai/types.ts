/** Parsed niche intelligence JSON — matches PROJECT_SPEC §13.1 and §3.3 columns. */
export type NicheIntelligenceCard = {
  summary: string;
  automation_demand_score: number;
  cold_call_viability_score: number;
  twentyfour_fit_score: number;
  avg_ticket_low: number;
  avg_ticket_high: number;
  currency: 'USD' | 'CAD' | 'GBP' | 'AUD';
  typical_bookings_per_month_low: number;
  typical_bookings_per_month_high: number;
  typical_monthly_revenue_low: number;
  typical_monthly_revenue_high: number;
  market_fragmentation: 'high' | 'medium' | 'low';
  phone_dependency: 'high' | 'medium' | 'low';
  existing_automation_adoption: 'low' | 'medium' | 'high';
  best_regions: string[];
  pain_points: string[];
  twentyfour_pitch_angles: string[];
  typical_owner_persona: string;
};

export type HaikuUsage = {
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
};

export type NicheIntelligenceRow = NicheIntelligenceCard & {
  id: string;
  niche_id: string;
  country: string;
  generation_source: string | null;
  generated_at: string | null;
  edited_by: string | null;
  last_refreshed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/** Columns callers may patch via updateNicheIntelligenceField. */
export type EditableIntelligenceField = keyof NicheIntelligenceCard;
