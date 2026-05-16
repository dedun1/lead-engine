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

/** System prompt — PROJECT_SPEC §13.2 (personalized opener). */
export const OPENER_GENERATION_PROMPT_SYSTEM = `You are a cold-call opener writer. Caller is from TwentyFour (twentyfour.app),
an AI automation service for SMBs handling missed calls, appointment reminders,
AI quote scheduling, review-response automation.

The caller has 8 seconds before the prospect decides to listen or hang up.

The opener must:
- Open with prospect's first name (or "Hey there" if unknown)
- Reference something SPECIFIC about THIS business (recent review, website
  signal, pain point) — never generic
- Connect that specific thing to a TwentyFour capability
- End with low-commitment ask ("got 30 seconds?")
- Sound human, not scripted
- Be 2-3 short sentences in opener_text (conversational, not robotic)`;

export type OpenerPromptArgs = {
  niche_name: string;
  niche_summary: string;
  pain_points: string[];
  twentyfour_pitch_angles: string[];
  business_name: string;
  rating: number | null;
  review_count: number | null;
  city: string | null;
  region: string | null;
  is_open_now: boolean;
  has_website: boolean;
  owner_name: string | null;
  variant_seed: number;
};

export function OPENER_GENERATION_PROMPT_USER(args: OpenerPromptArgs): string {
  const pains = args.pain_points.slice(0, 3).join('; ') || 'n/a';
  const angles =
    args.twentyfour_pitch_angles.slice(0, 3).join('; ') || 'n/a';
  const owner = args.owner_name?.split(/\s+/)[0] ?? 'unknown';

  return `Write a hyper-personalized cold-call opener for this specific lead.

Niche: ${args.niche_name}
Niche summary: ${args.niche_summary}
Top pain points: ${pains}
TwentyFour pitch angles: ${angles}

Business: ${args.business_name}
Owner first name (if known): ${owner}
Google rating: ${args.rating ?? 'unknown'} (${args.review_count ?? 0} reviews)
Location: ${args.city ?? 'unknown'}, ${args.region ?? 'unknown'}
Open right now: ${args.is_open_now ? 'yes' : 'no'}
Has website: ${args.has_website ? 'yes' : 'no'}
Variant seed (use a distinct angle): ${args.variant_seed}

Return ONLY valid JSON matching:
{
  "opener_text": "2-3 sentence opener",
  "hook_type": "review_velocity" | "storm_aftermath" | "rating_anchor" | "local_pride" | "generic_pain_point",
  "personalization_signals_used": ["strings"],
  "predicted_open_rate": 0.0-1.0
}

No markdown fences. No preamble.`;
}

export const OPENER_BASELINE_PROMPT_SYSTEM = `You are a cold-call opener writer for TwentyFour (twentyfour.app), an AI automation service for SMBs.

Generate a niche-generic baseline opener (no business-specific names or addresses). Sound human. End with a low-commitment question. 2-3 sentences max.

Return ONLY valid JSON with opener_text, hook_type, personalization_signals_used (empty array), predicted_open_rate. No markdown. No preamble.`;

export function OPENER_BASELINE_PROMPT_USER(
  nicheName: string,
  nicheSummary: string,
  variantSeed: number,
): string {
  return `Niche: ${nicheName}
Summary: ${nicheSummary}
Variant seed (vary the angle): ${variantSeed}

Return JSON: { "opener_text", "hook_type", "personalization_signals_used": [], "predicted_open_rate" }`;
}
