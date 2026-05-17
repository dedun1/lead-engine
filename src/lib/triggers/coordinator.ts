import {
  detectReviewVelocity,
  REVIEW_VELOCITY_SOURCE,
} from './detectors/review-velocity';
import {
  detectNegativeReview,
  NEGATIVE_REVIEW_SOURCE,
} from './detectors/negative-review';
import { detectStorm, STORM_SOURCE } from './detectors/storm';
import {
  detectNewBusiness,
  NEW_BUSINESS_SOURCE,
} from './detectors/new-business';
import {
  detectWebsiteChange,
  WEBSITE_CHANGE_SOURCE,
} from './detectors/website-change';
import {
  detectFacebookResurrection,
  FACEBOOK_RESURRECTION_SOURCE,
} from './detectors/facebook-resurrection';
import {
  detectGoogleReviewAcceleration,
  GOOGLE_REVIEW_ACCEL_SOURCE,
} from './detectors/google-review-acceleration';
import { fetchEligibleLeads } from './eligible-leads';
import { isTriggerDetectorDisabled, logTriggerDetectorHealth } from './health';
import { applyLeadPatches, insertTriggerEvents } from './persist';
import type { DetectorResult } from './types';

const TIMEOUT_MS = 60_000;
const CONCURRENCY = 3;

type DetectorJob = {
  source: string;
  run: (leads: Awaited<ReturnType<typeof fetchEligibleLeads>>) => Promise<DetectorResult>;
};

const DETECTORS: DetectorJob[] = [
  { source: REVIEW_VELOCITY_SOURCE, run: detectReviewVelocity },
  { source: GOOGLE_REVIEW_ACCEL_SOURCE, run: detectGoogleReviewAcceleration },
  { source: WEBSITE_CHANGE_SOURCE, run: detectWebsiteChange },
  { source: STORM_SOURCE, run: detectStorm },
  { source: NEGATIVE_REVIEW_SOURCE, run: detectNegativeReview },
  { source: FACEBOOK_RESURRECTION_SOURCE, run: detectFacebookResurrection },
  { source: NEW_BUSINESS_SOURCE, run: detectNewBusiness },
];

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('detector timeout')), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

async function runOne(
  job: DetectorJob,
  leads: Awaited<ReturnType<typeof fetchEligibleLeads>>,
): Promise<{ created: number; error?: string }> {
  if (await isTriggerDetectorDisabled(job.source)) {
    return { created: 0, error: 'disabled' };
  }
  try {
    const result = await withTimeout(job.run(leads), TIMEOUT_MS);
    await applyLeadPatches(result.leadPatches);
    const created = await insertTriggerEvents(result.events);
    await logTriggerDetectorHealth(job.source, true);
    return { created };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    await logTriggerDetectorHealth(job.source, false, msg);
    return { created: 0, error: msg };
  }
}

async function poolRun(
  jobs: DetectorJob[],
  leads: Awaited<ReturnType<typeof fetchEligibleLeads>>,
): Promise<Record<string, { created: number; error?: string }>> {
  const out: Record<string, { created: number; error?: string }> = {};
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i++]!;
      out[job.source] = await runOne(job, leads);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, () => worker()),
  );
  return out;
}

export type DetectAllResult = {
  total_triggers_created: number;
  by_type: Record<string, number>;
  errors: string[];
  duration_ms: number;
};

export async function detectAllTriggers(): Promise<DetectAllResult> {
  const start = Date.now();
  const leads = await fetchEligibleLeads();
  const results = await poolRun(DETECTORS, leads);

  let total = 0;
  const errors: string[] = [];
  const by_type: Record<string, number> = {};

  for (const [source, r] of Object.entries(results)) {
    total += r.created;
    if (r.error) errors.push(`${source}: ${r.error}`);
    by_type[source] = r.created;
  }

  await logTriggerDetectorHealth('trigger_coordinator', true);

  return {
    total_triggers_created: total,
    by_type,
    errors,
    duration_ms: Date.now() - start,
  };
}
