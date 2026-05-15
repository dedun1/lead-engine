'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/permissions';
import type { EditableIntelligenceField } from '@/lib/ai/types';
import type { Database } from '@/types/database.types';

export type ActionResult = { ok: true } | { ok: false; error: string };

type IntelligenceRow =
  Database['public']['Tables']['niche_intelligence']['Row'];

export async function getNicheIntelligence(
  nicheId: string,
  country: string,
): Promise<IntelligenceRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('niche_intelligence')
    .select('*')
    .eq('niche_id', nicheId)
    .eq('country', country)
    .maybeSingle();
  return data;
}

export async function updateNicheIntelligenceField(
  nicheId: string,
  country: string,
  field: EditableIntelligenceField,
  value: unknown,
): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (!user) return { ok: false, error: 'Unauthorized' };

    const supabase = createClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('niche_intelligence')
      .update({
        [field]: value,
        generation_source: 'manual_edit',
        edited_by: user.id,
        updated_at: now,
      } as Database['public']['Tables']['niche_intelligence']['Update'])
      .eq('niche_id', nicheId)
      .eq('country', country);

    if (error) return { ok: false, error: error.message };
    revalidatePath('/niches');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Update failed' };
  }
}
