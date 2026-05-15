import type { NicheIntelligenceCard } from '@/lib/ai/types';

const LEVELS = new Set(['high', 'medium', 'low']);
const CURRENCIES = new Set(['USD', 'CAD', 'GBP', 'AUD']);

export function isNicheIntelligenceCard(value: unknown): value is NicheIntelligenceCard {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.summary === 'string' &&
    typeof o.automation_demand_score === 'number' &&
    typeof o.cold_call_viability_score === 'number' &&
    typeof o.twentyfour_fit_score === 'number' &&
    typeof o.avg_ticket_low === 'number' &&
    typeof o.avg_ticket_high === 'number' &&
    typeof o.currency === 'string' &&
    CURRENCIES.has(o.currency as string) &&
    typeof o.typical_bookings_per_month_low === 'number' &&
    typeof o.typical_bookings_per_month_high === 'number' &&
    typeof o.typical_monthly_revenue_low === 'number' &&
    typeof o.typical_monthly_revenue_high === 'number' &&
    LEVELS.has(o.market_fragmentation as string) &&
    LEVELS.has(o.phone_dependency as string) &&
    LEVELS.has(o.existing_automation_adoption as string) &&
    Array.isArray(o.best_regions) &&
    Array.isArray(o.pain_points) &&
    Array.isArray(o.twentyfour_pitch_angles) &&
    typeof o.typical_owner_persona === 'string'
  );
}
