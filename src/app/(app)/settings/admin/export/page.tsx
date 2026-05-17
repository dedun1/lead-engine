import { createClient } from '@/lib/supabase/server';
import { ExportCard } from './export-card';

export default async function AdminExportPage() {
  const supabase = createClient();
  const { data: niches } = await supabase.from('niches').select('id, name').order('name');

  return (
    <div className="space-y-4">
      <ExportCard
        title="Leads"
        description="All lead columns including enrichment and fingerprint."
        kind="leads"
        niches={niches ?? []}
      />
      <ExportCard
        title="Call attempts"
        description="Outcomes, notes, tags, sentiment, opener and trigger links."
        kind="calls"
        niches={niches ?? []}
      />
      <ExportCard
        title="Trigger events"
        description="Type, severity, payload, actioned-by."
        kind="triggers"
        niches={niches ?? []}
      />
      <ExportCard
        title="Opener variants"
        description="Performance metrics aggregated from calls in range."
        kind="openers"
        niches={niches ?? []}
      />
      <ExportCard
        title="Activity feed"
        description="Flattened history entries (same shape as /history)."
        kind="activity"
        niches={niches ?? []}
      />
    </div>
  );
}
