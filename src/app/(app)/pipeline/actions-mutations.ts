'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser, getSessionContext } from '@/lib/permissions';
import { logActivity } from '@/lib/activity/log';
import { addToBlocklist } from '@/lib/dedup/blocklist';
import type { LeadStatus } from '@/lib/pipeline/types';

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidatePipeline() {
  revalidatePath('/pipeline');
}

async function requireUser() {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { data: lead } = await supabase
      .from('leads')
      .select('status')
      .eq('id', leadId)
      .single();
    if (!lead) return { ok: false, error: 'Lead not found' };

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (error) return { ok: false, error: error.message };

    await logActivity({
      lead_id: leadId,
      user_id: user.id,
      activity_type: 'status_change',
      payload: { from: lead.status, to: newStatus, changed_by: user.id },
    });
    revalidatePipeline();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to update status' };
  }
}

export async function updateLeadNotes(
  leadId: string,
  notes: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { error } = await supabase
      .from('leads')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (error) return { ok: false, error: error.message };

    await logActivity({
      lead_id: leadId,
      user_id: user.id,
      activity_type: 'note_added',
      payload: { preview: notes.slice(0, 200) },
    });
    revalidatePipeline();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to save notes' };
  }
}

export async function assignLead(
  leadId: string,
  assignedToUserId: string | null,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { error } = await supabase
      .from('leads')
      .update({
        assigned_to: assignedToUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);
    if (error) return { ok: false, error: error.message };

    await logActivity({
      lead_id: leadId,
      user_id: user.id,
      activity_type: assignedToUserId ? 'reassigned' : 'owner_assigned',
      payload: { assigned_to: assignedToUserId },
    });
    revalidatePipeline();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to assign lead' };
  }
}

export async function blockLead(
  leadId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { data: lead } = await supabase
      .from('leads')
      .select('fingerprint')
      .eq('id', leadId)
      .single();
    if (!lead) return { ok: false, error: 'Lead not found' };

    await addToBlocklist(lead.fingerprint, reason, user.id);
    await supabase
      .from('leads')
      .update({
        is_blocked: true,
        blocked_at: new Date().toISOString(),
        blocked_by: user.id,
        blocked_reason: reason,
      })
      .eq('id', leadId);

    await logActivity({
      lead_id: leadId,
      user_id: user.id,
      activity_type: 'lead_blocked',
      payload: { reason },
    });
    revalidatePipeline();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to block lead' };
  }
}

export async function markDnc(
  leadId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { error } = await supabase
      .from('leads')
      .update({ status: 'dnc', updated_at: new Date().toISOString() })
      .eq('id', leadId);
    if (error) return { ok: false, error: error.message };

    await logActivity({
      lead_id: leadId,
      user_id: user.id,
      activity_type: 'dnc_marked',
      payload: { reason },
    });
    revalidatePipeline();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to mark DNC' };
  }
}

export async function deleteLead(leadId: string): Promise<ActionResult> {
  try {
    const ctx = await getSessionContext();
    if (!ctx?.isAdmin) return { ok: false, error: 'Admin only' };

    const supabase = createClient();
    await supabase.from('lead_activities').delete().eq('lead_id', leadId);
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (error) return { ok: false, error: error.message };
    revalidatePipeline();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to delete lead' };
  }
}

export async function queueLead(leadId: string): Promise<ActionResult> {
  return updateLeadStatus(leadId, 'queued');
}
