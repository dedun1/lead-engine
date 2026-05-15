/** System prompt — PROJECT_SPEC §13.1 (niche intelligence). */
export const NICHE_INTELLIGENCE_PROMPT_SYSTEM = `You are a B2B sales analyst evaluating whether a niche in a given country is a strong target for selling AI-powered business automation (appointment reminders, missed-call SMS auto-reply, AI quote scheduling, follow-up automation, review-response automation).

Return ONLY valid JSON with no markdown fences and no preamble.`;

export function NICHE_INTELLIGENCE_PROMPT_USER(
  nicheName: string,
  country: string,
): string {
  return `Evaluate this niche for TwentyFour's cold-call outbound team.

Niche: ${nicheName}
Country: ${country}

Return ONLY valid JSON matching this schema:
{
  "summary": "2-3 sentence pitch summary an SDR can internalize before dialing",
  "automation_demand_score": 1-10,
  "cold_call_viability_score": 1-10,
  "twentyfour_fit_score": 1-10,
  "avg_ticket_low": number,
  "avg_ticket_high": number,
  "currency": "USD|CAD|GBP|AUD",
  "typical_bookings_per_month_low": int,
  "typical_bookings_per_month_high": int,
  "typical_monthly_revenue_low": number,
  "typical_monthly_revenue_high": number,
  "market_fragmentation": "high|medium|low",
  "phone_dependency": "high|medium|low",
  "existing_automation_adoption": "low|medium|high",
  "best_regions": ["region names within the country"],
  "pain_points": ["3-7 specific pain points"],
  "twentyfour_pitch_angles": ["3-5 cold-call hook angles"],
  "typical_owner_persona": "1-2 sentences on decision maker profile"
}

Be directionally accurate. Use ranges, never invented precision. Pick currency appropriate for the country.`;
}
