'use server';

import { revalidatePath } from 'next/cache';
import { getAuthUser } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export async function dismissWeeklyInsight(insightId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = createClient();
  const { data: row } = await supabase
    .from('weekly_insights')
    .select('dismissed_by')
    .eq('id', insightId)
    .maybeSingle();

  const dismissed = row?.dismissed_by ?? [];
  if (dismissed.includes(user.id)) {
    revalidatePath('/dashboard');
    return;
  }

  await supabase
    .from('weekly_insights')
    .update({ dismissed_by: [...dismissed, user.id] })
    .eq('id', insightId);

  revalidatePath('/dashboard');
}
