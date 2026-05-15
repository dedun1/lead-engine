import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { GeneratorClient } from './generator-client';

export default async function GeneratorPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const supabase = createClient();
  const { data: pitchingNiches } = await supabase
    .from('niches')
    .select('id, name')
    .eq('is_actively_pitching', true)
    .order('name');

  return (
    <div className="px-6 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Lead Generator
        </h1>
        <p className="text-sm text-muted-foreground">
          Scrape Google Maps, dedupe, and fill your pipeline.
        </p>
      </div>
      <GeneratorClient pitchingNiches={pitchingNiches ?? []} />
    </div>
  );
}
