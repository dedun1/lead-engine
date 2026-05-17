import { createAdminClient } from '@/lib/supabase/admin';
import type { LeadFieldPatch, TriggerEventDraft } from './types';

export async function insertTriggerEvents(
  events: TriggerEventDraft[],
): Promise<number> {
  if (!events.length) return 0;
  const admin = createAdminClient();
  let inserted = 0;
  for (const batch of chunk(events, 50)) {
    const { error, count } = await admin
      .from('trigger_events')
      .upsert(
        batch.map((e) => ({
          lead_id: e.lead_id,
          trigger_type: e.trigger_type,
          severity: e.severity,
          detected_at: e.detected_at,
          expires_at: e.expires_at,
          details: e.details,
          dedupe_key: e.dedupe_key,
          is_actioned: false,
        })),
        { onConflict: 'dedupe_key', ignoreDuplicates: true, count: 'exact' },
      );
    if (!error) inserted += count ?? batch.length;
  }
  return inserted;
}

export async function applyLeadPatches(patches: LeadFieldPatch[]): Promise<void> {
  if (!patches.length) return;
  const admin = createAdminClient();
  const byId = new Map<string, LeadFieldPatch>();
  for (const p of patches) {
    byId.set(p.id, { ...byId.get(p.id), ...p });
  }
  for (const p of byId.values()) {
    const { id, ...fields } = p;
    await admin
      .from('leads')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id);
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
