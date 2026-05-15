import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getSessionContext } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { PricingTable } from './pricing-table';

export default async function PricingPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const supabase = createClient();
  const { data: rows } = await supabase
    .from('pricing_config')
    .select('id, source, unit, cost_usd, notes')
    .order('source');

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Settings
      </Link>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pricing Config
        </h1>
        <p className="text-sm text-muted-foreground">
          Per-source unit costs used by the generation cost estimator.
        </p>
      </div>
      <PricingTable
        rows={(rows ?? []).map((r) => ({
          id: r.id,
          source: r.source ?? '',
          unit: r.unit,
          cost_usd: r.cost_usd,
          notes: r.notes,
        }))}
        isAdmin={ctx.isAdmin}
      />
    </div>
  );
}
