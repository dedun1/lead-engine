import type { NicheIntelligenceCard } from '@/lib/ai/types';
import type { Database } from '@/types/database.types';

type NicheIntelligenceInsert =
  Database['public']['Tables']['niche_intelligence']['Insert'];

export function cardToDbRow(
  card: NicheIntelligenceCard,
  meta: {
    niche_id: string;
    country: string;
    generation_source: 'claude_knowledge' | 'claude_web_search' | 'manual_edit';
    edited_by: string;
    generated_at: string;
  },
): NicheIntelligenceInsert {
  return {
    niche_id: meta.niche_id,
    country: meta.country,
    summary: card.summary,
    automation_demand_score: card.automation_demand_score,
    cold_call_viability_score: card.cold_call_viability_score,
    twentyfour_fit_score: card.twentyfour_fit_score,
    avg_ticket_low: card.avg_ticket_low,
    avg_ticket_high: card.avg_ticket_high,
    currency: card.currency,
    typical_bookings_per_month_low: card.typical_bookings_per_month_low,
    typical_bookings_per_month_high: card.typical_bookings_per_month_high,
    typical_monthly_revenue_low: card.typical_monthly_revenue_low,
    typical_monthly_revenue_high: card.typical_monthly_revenue_high,
    market_fragmentation: card.market_fragmentation,
    phone_dependency: card.phone_dependency,
    existing_automation_adoption: card.existing_automation_adoption,
    best_regions: card.best_regions,
    pain_points: card.pain_points,
    twentyfour_pitch_angles: card.twentyfour_pitch_angles,
    typical_owner_persona: card.typical_owner_persona,
    generation_source: meta.generation_source,
    generated_at: meta.generated_at,
    last_refreshed_at: meta.generated_at,
    edited_by: meta.edited_by,
    updated_at: meta.generated_at,
  };
}
