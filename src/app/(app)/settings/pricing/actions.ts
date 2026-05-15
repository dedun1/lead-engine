'use server';

import { revalidatePath } from 'next/cache';
import { PRICING_CONFIG_DEFAULTS } from '@/lib/pricing/defaults';
import { requireAdmin } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updatePricingConfig(
  id: string,
  field: 'cost_usd' | 'notes',
  value: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createClient();

    if (field === 'cost_usd') {
      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed < 0) {
        return { ok: false, error: 'Invalid cost' };
      }
      const { error } = await supabase
        .from('pricing_config')
        .update({ cost_usd: parsed, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('pricing_config')
        .update({ notes: value, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath('/settings/pricing');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Update failed';
    return { ok: false, error: message };
  }
}

export async function resetPricingToDefaults(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createClient();

    for (const row of PRICING_CONFIG_DEFAULTS) {
      const { error } = await supabase
        .from('pricing_config')
        .update({
          unit: row.unit,
          cost_usd: row.cost_usd,
          notes: row.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('source', row.source);
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath('/settings/pricing');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Reset failed';
    return { ok: false, error: message };
  }
}
