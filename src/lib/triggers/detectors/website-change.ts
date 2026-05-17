import type { DetectorResult, EligibleLead } from '../types';
import { normalizeVisibleText, sha256Body } from '../utils';

const SOURCE = 'trigger_website_change';
const CAP = 50;

export async function detectWebsiteChange(
  leads: EligibleLead[],
): Promise<DetectorResult> {
  const events: DetectorResult['events'] = [];
  const leadPatches: DetectorResult['leadPatches'] = [];
  const withSite = leads.filter((l) => l.website).slice(0, CAP);
  const now = new Date().toISOString();

  for (const lead of withSite) {
    try {
      const url = lead.website!.startsWith('http')
        ? lead.website!
        : `https://${lead.website}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': 'LeadEngineTriggerBot/1.0' },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const body = normalizeVisibleText(html);
      const hash = sha256Body(body);

      if (!lead.website_snapshot_hash) {
        leadPatches.push({
          id: lead.id,
          website_snapshot_hash: hash,
          website_snapshot_at: now,
        });
        continue;
      }

      if (hash !== lead.website_snapshot_hash) {
        events.push({
          lead_id: lead.id,
          trigger_type: 'website_change',
          severity: 'low',
          detected_at: now,
          expires_at: null,
          dedupe_key: `website-change-${lead.id}-${hash}`,
          details: {
            previous_hash: lead.website_snapshot_hash,
            current_hash: hash,
            change_detected_at: now,
          },
        });
        leadPatches.push({
          id: lead.id,
          website_snapshot_hash: hash,
          website_snapshot_at: now,
        });
      }
    } catch {
      // per-lead failure — continue
    }
  }

  return { events, leadPatches };
}

export const WEBSITE_CHANGE_SOURCE = SOURCE;
