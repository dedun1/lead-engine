import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database.types';

export const ACTIVITY_TYPES = [
  'call',
  'status_change',
  'note_added',
  'owner_assigned',
  'enrichment_added',
  'lead_blocked',
  'lead_unblocked',
  'dnc_marked',
  'lead_created',
  'reassigned',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export async function logActivity(params: {
  lead_id: string;
  user_id: string;
  activity_type: ActivityType;
  payload?: Json;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('lead_activities').insert({
      lead_id: params.lead_id,
      actor_id: params.user_id,
      activity_type: params.activity_type,
      payload: params.payload ?? {},
    });
  } catch (error) {
    console.error('logActivity failed', error);
  }
}
