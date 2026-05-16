import { createAdminClient } from '@/lib/supabase/admin';

/** Update scraper_health for an enrichment source (never throws). */
export async function logEnrichmentSourceHealth(
  source: string,
  ok: boolean,
  error?: string,
): Promise<{ disabled: boolean }> {
  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('scraper_health')
      .select('id, consecutive_failures, status')
      .eq('source', source)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const prev = existing?.consecutive_failures ?? 0;
    const consecutive = ok ? 0 : prev + 1;
    const status =
      consecutive >= 3 ? 'down' : ok ? 'healthy' : 'degraded';

    const row = {
      source,
      status,
      last_check_at: new Date().toISOString(),
      last_error: ok ? null : error?.slice(0, 500) ?? 'unknown',
      consecutive_failures: consecutive,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await admin.from('scraper_health').update(row).eq('id', existing.id);
    } else {
      await admin.from('scraper_health').insert(row);
    }

    return { disabled: status === 'down' };
  } catch {
    return { disabled: false };
  }
}

export async function isEnrichmentSourceDisabled(
  source: string,
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('scraper_health')
      .select('status, consecutive_failures')
      .eq('source', source)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.status === 'down' || (data?.consecutive_failures ?? 0) >= 3;
  } catch {
    return false;
  }
}
