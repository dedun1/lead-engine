'use server';

import { revalidatePath } from 'next/cache';
import { getAuthUser } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export async function dismissTrigger(triggerId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = createClient();
  await supabase
    .from('trigger_events')
    .update({
      is_actioned: true,
      actioned_by: user.id,
      actioned_at: new Date().toISOString(),
    })
    .eq('id', triggerId);

  revalidatePath('/hot-list');
  revalidatePath('/pipeline');
}

export async function addLeadToQueue(leadId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = createClient();
  await supabase
    .from('leads')
    .update({ status: 'queued', updated_at: new Date().toISOString() })
    .eq('id', leadId);

  revalidatePath('/hot-list');
  revalidatePath('/pipeline');
}
