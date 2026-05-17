import type { DetectorResult, EligibleLead } from '../types';
import { growth30d, isoWeekKey } from '../utils';

const SOURCE = 'trigger_google_review_acceleration';

export async function detectGoogleReviewAcceleration(
  leads: EligibleLead[],
): Promise<DetectorResult> {
  const events: DetectorResult['events'] = [];
  const week = isoWeekKey();

  for (const lead of leads) {
    const history = lead.review_count_history;
    if (history.length < 2) continue;

    const { current, prior } = growth30d(history);
    if (current < 5) continue;
    if (prior <= 0 || current <= prior * 3) continue;

    const factor = Math.round((current / Math.max(prior, 1)) * 10) / 10;

    events.push({
      lead_id: lead.id,
      trigger_type: 'google_traffic_spike',
      severity: 'medium',
      detected_at: new Date().toISOString(),
      expires_at: null,
      dedupe_key: `review-accel-${lead.id}-${week}`,
      details: {
        current_30d_growth: current,
        prior_30d_growth: prior,
        acceleration_factor: factor,
      },
    });
  }

  return { events, leadPatches: [] };
}

export const GOOGLE_REVIEW_ACCEL_SOURCE = SOURCE;
