import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Db = SupabaseClient<Database>;

/** Explicit deletes — FKs do not CASCADE on leads in current schema. */
export async function deleteLeadsCascade(
  supabase: Db,
  leadIds: string[],
): Promise<void> {
  if (!leadIds.length) return;
  const chunk = 200;
  for (let i = 0; i < leadIds.length; i += chunk) {
    const ids = leadIds.slice(i, i + chunk);
    await supabase.from('call_attempts').delete().in('lead_id', ids);
    await supabase.from('trigger_events').delete().in('lead_id', ids);
    await supabase.from('lead_activities').delete().in('lead_id', ids);
    await supabase
      .from('pitch_opener_variants')
      .delete()
      .in('lead_id', ids);
    const { error } = await supabase.from('leads').delete().in('id', ids);
    if (error) throw new Error(error.message);
  }
}

export async function mergeLeadIntoPrimary(
  supabase: Db,
  primaryId: string,
  duplicateIds: string[],
): Promise<void> {
  for (const dupId of duplicateIds) {
    if (dupId === primaryId) continue;
    await supabase
      .from('call_attempts')
      .update({ lead_id: primaryId })
      .eq('lead_id', dupId);
    await supabase
      .from('trigger_events')
      .update({ lead_id: primaryId })
      .eq('lead_id', dupId);
    await supabase
      .from('lead_activities')
      .update({ lead_id: primaryId })
      .eq('lead_id', dupId);
    await supabase.from('leads').delete().eq('id', dupId);
  }
}
