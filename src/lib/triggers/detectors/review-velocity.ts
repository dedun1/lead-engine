import type { DetectorResult, EligibleLead, TriggerSeverity } from '../types';
import {
  appendReviewSnapshot,
  isoWeekKey,
  snapshotAt,
} from '../utils';

const SOURCE = 'trigger_review_velocity';

function severity(pct: number, abs: number): TriggerSeverity | null {
  if (abs < 10 && pct < 50) return null;
  if (pct > 500 || abs > 50) return 'critical';
  if (pct > 200) return 'high';
  if (pct > 100) return 'medium';
  if (pct >= 50 || abs >= 10) return 'low';
  return null;
}

export async function detectReviewVelocity(
  leads: EligibleLead[],
): Promise<DetectorResult> {
  const events: DetectorResult['events'] = [];
  const leadPatches: DetectorResult['leadPatches'] = [];
  const week = isoWeekKey();

  for (const lead of leads) {
    const current = lead.google_review_count ?? 0;
    const history = lead.review_count_history;
    const priorSnap = snapshotAt(history, 7);

    if (!priorSnap) {
      leadPatches.push({
        id: lead.id,
        review_count_history: appendReviewSnapshot(history, current),
        google_review_count: current,
      });
      continue;
    }

    const previous = priorSnap.count;
    const growth = current - previous;
    const pct = previous > 0 ? (growth / previous) * 100 : growth > 0 ? 100 : 0;
    const sev = severity(pct, growth);

    leadPatches.push({
      id: lead.id,
      review_count_history: appendReviewSnapshot(history, current),
      google_review_count: current,
    });

    if (!sev) continue;

    events.push({
      lead_id: lead.id,
      trigger_type: 'review_velocity_spike',
      severity: sev,
      detected_at: new Date().toISOString(),
      expires_at: null,
      dedupe_key: `review-velocity-${lead.id}-${week}`,
      details: {
        current_count: current,
        previous_count: previous,
        growth_pct: Math.round(pct),
        growth_absolute: growth,
      },
    });
  }

  return { events, leadPatches };
}

export const REVIEW_VELOCITY_SOURCE = SOURCE;
