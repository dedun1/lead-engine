import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type ScraperHealthRow =
  Database['public']['Tables']['scraper_health']['Row'];

/** Latest scraper_health row per distinct source (newest updated_at wins). */
export async function fetchLatestHealthBySource(): Promise<ScraperHealthRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scraper_health')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  const bySource = new Map<string, ScraperHealthRow>();
  for (const row of data) {
    const key = row.source ?? 'unknown';
    if (!bySource.has(key)) bySource.set(key, row);
  }

  return [...bySource.values()].sort((a, b) =>
    (a.source ?? '').localeCompare(b.source ?? ''),
  );
}
