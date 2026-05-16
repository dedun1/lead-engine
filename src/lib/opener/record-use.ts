'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/permissions';

/** Increment times_used when Call Now is pressed with an active opener. */
export async function recordOpenerUseOnCall(
  leadId: string,
): Promise<{ openerVariantId: string | null }> {
  const user = await getAuthUser();
  if (!user) return { openerVariantId: null };

  const supabase = createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('current_opener_variant_id')
    .eq('id', leadId)
    .maybeSingle();

  let variantId = lead?.current_opener_variant_id ?? null;

  if (!variantId) {
    const { data: personalized } = await supabase
      .from('pitch_opener_variants')
      .select('id')
      .eq('lead_id', leadId)
      .eq('is_personalized', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    variantId = personalized?.id ?? null;
  }

  if (!variantId) return { openerVariantId: null };

  const { data: variant } = await supabase
    .from('pitch_opener_variants')
    .select('times_used')
    .eq('id', variantId)
    .single();

  if (variant) {
    await supabase
      .from('pitch_opener_variants')
      .update({
        times_used: (variant.times_used ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId);
  }

  return { openerVariantId: variantId };
}
