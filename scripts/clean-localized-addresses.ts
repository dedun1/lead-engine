/**
 * One-off: strip Arabic / localized Maps prefixes from lead addresses.
 * Manual run only: pnpm tsx scripts/clean-localized-addresses.ts
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';
import {
  addressNeedsLocalizationClean,
  cleanLocalizedAddress,
} from '../src/lib/leads/address-clean';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: rows, error } = await admin
    .from('leads')
    .select('id, address')
    .not('address', 'is', null);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let updated = 0;
  for (const row of rows ?? []) {
    const addr = row.address;
    if (!addr || !addressNeedsLocalizationClean(addr)) continue;
    const cleaned = cleanLocalizedAddress(addr);
    if (cleaned === addr) continue;
    const { error: upErr } = await admin
      .from('leads')
      .update({ address: cleaned })
      .eq('id', row.id);
    if (upErr) {
      console.error(row.id, upErr.message);
      continue;
    }
    updated += 1;
    console.log(`Updated ${row.id}: ${addr.slice(0, 40)}… → ${cleaned.slice(0, 60)}…`);
  }
  console.log(`Done. ${updated} lead(s) cleaned.`);
}

void main();
