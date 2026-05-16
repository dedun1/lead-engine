'use server';

import { createClient } from '@/lib/supabase/server';

/** Bump meetings_set when a call logs booked_meeting with an opener attached. */
export async function incrementOpenerMeetingIfBooked(
  openerVariantId: string | null,
  subOutcome: string | null,
): Promise<void> {
  if (!openerVariantId || subOutcome !== 'booked_meeting') return;

  const supabase = createClient();
  const { data: variant } = await supabase
    .from('pitch_opener_variants')
    .select('meetings_set')
    .eq('id', openerVariantId)
    .single();

  if (!variant) return;

  await supabase
    .from('pitch_opener_variants')
    .update({
      meetings_set: (variant.meetings_set ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', openerVariantId);
}
