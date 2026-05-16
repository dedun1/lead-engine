'use server';

import { revalidatePath } from 'next/cache';
import { DateTime } from 'luxon';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity/log';
import { getAuthUser, getSessionContext } from '@/lib/permissions';
import type { LeadStatus } from '@/lib/pipeline/types';
import { sortQueueLeads } from './sort-queue';
import type { QueueFilter, QueueLeadsResult, QueueLeadRow } from './types';

function startOfUtcDayIso(): string {
  return DateTime.utc().startOf('day').toISO()!;
}

async function requireActorId(): Promise<string> {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');
  return user.id;
}

export async function getCalledTodayCount(actorId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('call_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('actor_id', actorId)
    .gte('called_at', startOfUtcDayIso());
  return count ?? 0;
}

export async function getQueueLeads(
  filter: QueueFilter = 'all',
): Promise<QueueLeadsResult> {
  const ctx = await getSessionContext();
  if (!ctx?.user) return { leads: [], calledToday: 0 };

  const supabase = createClient();
  let query = supabase
    .from('leads')
    .select('id, business_name, status, city, assigned_to, created_at')
    .eq('status', 'queued')
    .eq('is_blocked', false);

  if (filter === 'mine') {
    query = query.eq('assigned_to', ctx.user.id);
  } else if (filter === 'unassigned') {
    query = query.is('assigned_to', null);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getQueueLeads', error.message);
    return { leads: [], calledToday: 0 };
  }

  const rows = (data ?? []) as QueueLeadRow[];
  const leads = sortQueueLeads(rows, ctx.user.id);
  const calledToday = await getCalledTodayCount(ctx.user.id);
  return { leads, calledToday };
}

export async function markLeadDeadInQueue(
  leadId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const actorId = await requireActorId();
    const supabase = createClient();
    const { data: lead } = await supabase
      .from('leads')
      .select('status')
      .eq('id', leadId)
      .single();
    if (!lead) return { ok: false, error: 'Lead not found' };

    const from = lead.status as LeadStatus;
    const { error } = await supabase
      .from('leads')
      .update({
        status: 'dead',
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);
    if (error) return { ok: false, error: error.message };

    await logActivity({
      lead_id: leadId,
      user_id: actorId,
      activity_type: 'status_change',
      payload: { from, to: 'dead', source: 'call_queue_shortcut' },
    });

    revalidatePath('/call-queue');
    revalidatePath('/pipeline');
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update lead';
    return { ok: false, error: msg };
  }
}
