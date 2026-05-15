import { createAdminClient } from '@/lib/supabase/admin';

export async function isFingerprintBlocked(fingerprint: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('blocked_fingerprints')
      .select('fingerprint')
      .eq('fingerprint', fingerprint)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function addToBlocklist(
  fingerprint: string,
  reason: string,
  byUserId: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin.from('blocked_fingerprints').upsert(
    {
      fingerprint,
      reason,
      blocked_by: byUserId,
      blocked_at: new Date().toISOString(),
    },
    { onConflict: 'fingerprint' },
  );
}

export async function removeFromBlocklist(fingerprint: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('blocked_fingerprints')
    .delete()
    .eq('fingerprint', fingerprint);
}
