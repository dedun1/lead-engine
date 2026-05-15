import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';
import { parseCsvFile } from './lib/parse-csv';

config({ path: '.env.local' });

const COUNTRY_SCOPE = ['US', 'CA', 'UK', 'AU'];

const PLACEHOLDER_NICHES = [
  { code: '238160', title: 'Roofing Contractors', parent_sector: 'Construction' },
  { code: '621210', title: 'Offices of Dentists', parent_sector: 'Health Care' },
  { code: '812112', title: 'Beauty Salons', parent_sector: 'Personal Services' },
  { code: '722511', title: 'Full-Service Restaurants', parent_sector: 'Food Service' },
  { code: '541110', title: 'Offices of Lawyers', parent_sector: 'Professional Services' },
  { code: '541512', title: 'Computer Systems Design Services', parent_sector: 'Professional Services' },
  { code: '441310', title: 'Automotive Parts and Accessories Stores', parent_sector: 'Retail' },
  { code: '811111', title: 'General Automotive Repair', parent_sector: 'Auto Services' },
  { code: '531210', title: 'Offices of Real Estate Agents and Brokers', parent_sector: 'Real Estate' },
  { code: '713940', title: 'Fitness and Recreational Sports Centers', parent_sector: 'Fitness' },
  { code: '236118', title: 'Residential Remodelers', parent_sector: 'Construction' },
  { code: '621310', title: 'Offices of Chiropractors', parent_sector: 'Health Care' },
  { code: '812111', title: 'Barber Shops', parent_sector: 'Personal Services' },
  { code: '722513', title: 'Limited-Service Restaurants', parent_sector: 'Food Service' },
  { code: '541211', title: 'Offices of Certified Public Accountants', parent_sector: 'Professional Services' },
  { code: '453910', title: 'Pet and Pet Supplies Stores', parent_sector: 'Retail' },
  { code: '811192', title: 'Car Washes', parent_sector: 'Auto Services' },
  { code: '531311', title: 'Residential Property Managers', parent_sector: 'Real Estate' },
  { code: '561622', title: 'Locksmiths', parent_sector: 'Misc' },
  { code: '524210', title: 'Insurance Agencies and Brokerages', parent_sector: 'Misc' },
];

type NicheRow = {
  naics_code: string;
  name: string;
  parent_sector: string;
};

function loadRows(): NicheRow[] {
  const csvPath = resolve(process.cwd(), 'supabase/seed/naics_codes.csv');
  if (existsSync(csvPath)) {
    return parseCsvFile(csvPath).map((row) => ({
      naics_code: (row.code ?? row.naics_code ?? '').trim(),
      name: (row.title ?? row.name ?? '').trim(),
      parent_sector: (row.parent_sector ?? 'Misc').trim(),
    }));
  }
  return PLACEHOLDER_NICHES.map((r) => ({
    naics_code: r.code,
    name: r.title,
    parent_sector: r.parent_sector,
  }));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows = loadRows().filter((r) => r.naics_code && r.name);
  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const { data: existing } = await supabase
      .from('niches')
      .select('id')
      .eq('naics_code', row.naics_code)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from('niches')
        .update({
          name: row.name,
          parent_sector: row.parent_sector,
          country_scope: COUNTRY_SCOPE,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) {
        console.error(`Update failed ${row.naics_code}:`, error.message);
        process.exit(1);
      }
      updated += 1;
    } else {
      const { error } = await supabase.from('niches').insert({
        naics_code: row.naics_code,
        name: row.name,
        parent_sector: row.parent_sector,
        country_scope: COUNTRY_SCOPE,
      });
      if (error) {
        console.error(`Insert failed ${row.naics_code}:`, error.message);
        process.exit(1);
      }
      inserted += 1;
    }
  }

  console.log(`Inserted ${inserted} new, updated ${updated} existing`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
