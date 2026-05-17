import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database.types';

export const ADMIN_AUDIT_TYPES = [
  'lead_blocked',
  'lead_unblocked',
  'dnc_marked',
  'lead_deleted',
  'bulk_deleted',
  'bulk_reassigned',
  'bulk_status_updated',
  'role_changed',
  'team_member_deactivated',
  'team_member_reactivated',
] as const;

export type AdminAuditType = (typeof ADMIN_AUDIT_TYPES)[number];

/** Log admin/bulk intent BEFORE mutating data (audit survives partial failures). */
export async function logAdminAudit(params: {
  actor_id: string;
  activity_type: string;
  lead_id?: string | null;
  payload?: Json;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('lead_activities').insert({
      actor_id: params.actor_id,
      lead_id: params.lead_id ?? null,
      activity_type: params.activity_type,
      payload: params.payload ?? {},
    });
  } catch (error) {
    console.error('logAdminAudit failed', error);
  }
}

export const AUDIT_TYPE_LABELS: Record<string, string> = {
  lead_blocked: 'Lead blocked',
  lead_unblocked: 'Lead unblocked',
  dnc_marked: 'DNC marked',
  lead_deleted: 'Lead deleted',
  bulk_deleted: 'Bulk delete',
  bulk_reassigned: 'Bulk reassign',
  bulk_status_updated: 'Bulk status update',
  role_changed: 'Role changed',
  team_member_deactivated: 'Member deactivated',
  team_member_reactivated: 'Member reactivated',
};
