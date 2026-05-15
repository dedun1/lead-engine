import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';
import { parseCsvFile } from './lib/parse-csv';

config({ path: '.env.local' });

function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === 'true';
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const csvPath = resolve(process.cwd(), 'supabase/seed/shortlist.csv');
  const rows = parseCsvFile(csvPath);
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const naics = row.naics_code?.trim();
    if (!naics) continue;

    const { data, error } = await supabase
      .from('niches')
      .update({
        is_shortlist: true,
        parent_sector: row.parent_sector?.trim() || null,
        weather_sensitive: parseBoolean(row.weather_sensitive ?? 'false'),
        updated_at: new Date().toISOString(),
      })
      .eq('naics_code', naics)
      .select('id');

    if (error) {
      console.error(`Failed ${naics}:`, error.message);
      process.exit(1);
    }
    if (!data?.length) skipped += 1;
    else updated += data.length;
  }

  console.log(`Updated ${updated} shortlist rows, skipped ${skipped} (not in niches table)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
