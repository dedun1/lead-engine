'use server';

import { revalidatePath } from 'next/cache';
import { DateTime } from 'luxon';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity/log';
import { addToBlocklist } from '@/lib/dedup/blocklist';
import { getAuthUser } from '@/lib/permissions';
import type { LeadStatus } from '@/lib/pipeline/types';
import { incrementOpenerMeetingIfBooked } from '@/lib/opener/apply-meeting-from-call';
import type { SaveCallOutcomeInput } from './types';

export type SaveOutcomeResult = { ok: true } | { ok: false; error: string };

function buildLastOutcome(
  outcome: string,
  subOutcome: string | null,
): string {
  return subOutcome ? `${outcome}:${subOutcome}` : outcome;
}

function resolveLeadStatusUpdate(
  input: SaveCallOutcomeInput,
): Partial<{
  status: LeadStatus;
  is_blocked: boolean;
  blocked_at: string;
  blocked_by: string;
  blocked_reason: string;
}> {
  const now = new Date().toISOString();
  const { outcome, subOutcome } = input;

  if (subOutcome === 'dnc_requested') {
    return { status: 'dnc' };
  }
  if (subOutcome === 'booked_meeting') {
    return { status: 'meeting_set' };
  }
  if (subOutcome === 'interested' || subOutcome === 'follow_up_requested') {
    return { status: 'contacted' };
  }
  if (outcome === 'wrong_number') {
    return {
      status: 'dead',
      is_blocked: true,
      blocked_at: now,
      blocked_reason: 'wrong_number',
    };
  }
  if (outcome === 'disconnected') {
    return { status: 'dead' };
  }
  return {};
}

export async function saveCallOutcome(
  input: SaveCallOutcomeInput,
): Promise<SaveOutcomeResult> {
  try {
    const user = await getAuthUser();
    if (!user) return { ok: false, error: 'Unauthorized' };

    const supabase = createClient();
    const { data: lead } = await supabase
      .from('leads')
      .select('timezone, times_called, fingerprint')
      .eq('id', input.leadId)
      .single();

    if (!lead) return { ok: false, error: 'Lead not found' };

    const tz = lead.timezone ?? 'America/New_York';
    const local = DateTime.fromISO(input.calledAt).setZone(tz);
    const lastOutcome = buildLastOutcome(input.outcome, input.subOutcome);

    const { error: insertErr } = await supabase.from('call_attempts').insert({
      lead_id: input.leadId,
      actor_id: user.id,
      called_at: input.calledAt,
      duration_seconds: input.durationSeconds,
      outcome: input.outcome,
      sub_outcome: input.subOutcome,
      notes: input.notes,
      tags: input.tags,
      sentiment_score: input.sentimentScore,
      next_contact_date: input.nextContactDate,
      opener_variant_id: input.openerVariantId,
      prospect_local_hour: local.hour,
      prospect_local_day: local.weekday % 7,
    });

    if (insertErr) return { ok: false, error: insertErr.message };

    const now = new Date().toISOString();
    const statusPatch = resolveLeadStatusUpdate(input);
    const timesCalled = (lead.times_called ?? 0) + 1;

    await supabase
      .from('leads')
      .update({
        times_called: timesCalled,
        last_called_at: now,
        last_outcome: lastOutcome,
        updated_at: now,
        ...statusPatch,
        ...(statusPatch.is_blocked
          ? { blocked_by: user.id }
          : {}),
      })
      .eq('id', input.leadId);

    if (input.outcome === 'wrong_number' && lead.fingerprint) {
      await addToBlocklist(lead.fingerprint, 'wrong_number', user.id);
    }

    const notesPreview = (input.notes ?? '').slice(0, 100);
    await logActivity({
      lead_id: input.leadId,
      user_id: user.id,
      activity_type: 'call',
      payload: {
        outcome: input.outcome,
        sub_outcome: input.subOutcome,
        duration_seconds: input.durationSeconds,
        notes_preview: notesPreview,
        sentiment: input.sentimentScore,
        tags: input.tags,
      },
    });

    await incrementOpenerMeetingIfBooked(
      input.openerVariantId,
      input.subOutcome,
    );

    if (input.subOutcome === 'dnc_requested') {
      await logActivity({
        lead_id: input.leadId,
        user_id: user.id,
        activity_type: 'dnc_marked',
        payload: { reason: 'dnc_requested_on_call' },
      });
    }

    revalidatePath('/call-queue');
    revalidatePath('/pipeline');
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save outcome';
    return { ok: false, error: msg };
  }
}
