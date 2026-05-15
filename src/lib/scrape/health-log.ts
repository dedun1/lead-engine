import { createAdminClient } from '@/lib/supabase/admin';

const SOURCE = 'google_maps';

export async function logScraperHealth(params: {
  ok: boolean;
  error?: string;
  latency_ms?: number;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('scraper_health')
      .select('id, consecutive_failures')
      .eq('source', SOURCE)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const prevFailures = existing?.consecutive_failures ?? 0;
    const consecutive = params.ok ? 0 : prevFailures + 1;
    const status =
      consecutive >= 3 ? 'down' : params.ok ? 'healthy' : 'degraded';

    const row = {
      source: SOURCE,
      status,
      last_check_at: new Date().toISOString(),
      last_error: params.ok ? null : params.error?.slice(0, 500) ?? 'unknown',
      consecutive_failures: consecutive,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await admin.from('scraper_health').update(row).eq('id', existing.id);
    } else {
      await admin.from('scraper_health').insert(row);
    }
  } catch {
    // Never throw from health logging
  }
}
