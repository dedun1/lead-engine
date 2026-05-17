'use server';

import { createClient } from '@/lib/supabase/server';
import type { LeadTriggerRow } from '@/components/pipeline/lead-triggers-panel';
import type { TriggerType } from './types';

export async function fetchActiveTriggersForLead(
  leadId: string,
): Promise<LeadTriggerRow[]> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('trigger_events')
    .select('id, trigger_type, severity, detected_at, expires_at, details')
    .eq('lead_id', leadId)
    .eq('is_actioned', false)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('detected_at', { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    trigger_type: row.trigger_type as TriggerType,
    severity: row.severity,
    detected_at: row.detected_at,
    expires_at: row.expires_at,
    details: row.details as Record<string, unknown> | null,
  }));
}
