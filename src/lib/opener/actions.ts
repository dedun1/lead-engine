'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser, requireAdmin } from '@/lib/permissions';
import type { OpenerVariantRow } from '@/lib/ai/opener-types';

export type LeadOpenerBundle = {
  personalized: OpenerVariantRow | null;
  baselines: OpenerVariantRow[];
  currentVariantId: string | null;
  nicheId: string | null;
  country: string | null;
};

export async function fetchLeadOpenerBundle(
  leadId: string,
): Promise<LeadOpenerBundle | null> {
  const supabase = createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('niche_id, country, current_opener_variant_id')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead?.niche_id) return null;

  const { data: personalized } = await supabase
    .from('pitch_opener_variants')
    .select(
      'id, opener_text, hook_type, predicted_open_rate, personalization_signals_used, times_used, meetings_set, conversion_rate, is_personalized, is_edited, niche_id, lead_id, name',
    )
    .eq('lead_id', leadId)
    .eq('is_personalized', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: baselines } = await supabase
    .from('pitch_opener_variants')
    .select(
      'id, opener_text, hook_type, predicted_open_rate, personalization_signals_used, times_used, meetings_set, conversion_rate, is_personalized, is_edited, niche_id, lead_id, name',
    )
    .eq('niche_id', lead.niche_id)
    .eq('is_personalized', false)
    .eq('is_active', true)
    .order('name');

  return {
    personalized: (personalized as OpenerVariantRow) ?? null,
    baselines: (baselines ?? []) as OpenerVariantRow[],
    currentVariantId: lead.current_opener_variant_id,
    nicheId: lead.niche_id,
    country: lead.country,
  };
}

export async function updateOpenerText(
  variantId: string,
  openerText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await getAuthUser();
    const supabase = createClient();
    const { error } = await supabase
      .from('pitch_opener_variants')
      .update({
        opener_text: openerText,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/pipeline');
    revalidatePath('/call-queue');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to save opener edit' };
  }
}

export async function setLeadCurrentOpener(
  leadId: string,
  variantId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await getAuthUser();
    const supabase = createClient();
    const { error } = await supabase
      .from('leads')
      .update({
        current_opener_variant_id: variantId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/pipeline');
    revalidatePath('/call-queue');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to set opener' };
  }
}

export async function triggerBaselineGenerationIfNeeded(
  nicheId: string,
  country: string,
): Promise<void> {
  try {
    const user = await requireAdmin();
    const { countBaselineVariants, generateNicheBaselineVariants } = await import(
      '@/lib/opener/generate-baseline'
    );
    const count = await countBaselineVariants(nicheId);
    if (count >= 3) return;
    await generateNicheBaselineVariants({
      nicheId,
      country,
      userId: user.id,
      numVariants: 5,
    });
  } catch (error) {
    console.error('background baseline generation failed', error);
  }
}
