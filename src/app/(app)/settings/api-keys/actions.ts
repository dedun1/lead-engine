'use server';

import { revalidatePath } from 'next/cache';
import { encrypt, getLastFour } from '@/lib/crypto';
import { testDecryptedApiKey } from '@/lib/api-keys/test-key';
import { requireAdmin } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveApiKey(
  service: string,
  plaintext: string,
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const trimmed = plaintext.trim();
    if (!trimmed) {
      return { ok: false, error: 'Key cannot be empty' };
    }

    const supabase = createClient();
    const { error } = await supabase.from('api_keys').upsert(
      {
        service,
        encrypted_value: encrypt(trimmed),
        last_four: getLastFour(trimmed),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'service' },
    );
    if (error) return { ok: false, error: error.message };

    revalidatePath('/settings/api-keys');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save key';
    return { ok: false, error: message };
  }
}

export async function deleteApiKey(service: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createClient();
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('service', service);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/settings/api-keys');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete key';
    return { ok: false, error: message };
  }
}

export async function testApiKey(service: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('api_keys')
      .select('encrypted_value')
      .eq('service', service)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data?.encrypted_value) {
      return { ok: false, error: 'No saved key for this service' };
    }

    const { decrypt } = await import('@/lib/crypto');
    const result = await testDecryptedApiKey(
      service,
      decrypt(data.encrypted_value),
    );
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Test failed';
    return { ok: false, error: message };
  }
}
