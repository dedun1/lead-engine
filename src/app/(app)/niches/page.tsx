import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/permissions';
import { fetchNiches, getNicheCount } from './actions';
import { NicheGrid } from './niche-grid';
import { SeedEmptyState } from './seed-empty-state';

export default async function NichesPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const count = await getNicheCount();
  if (count === 0) {
    return (
      <div className="px-6 py-10">
        <div className="mb-8 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Niche Explorer
          </h1>
          <p className="text-sm text-muted-foreground">
            Research industries before generating leads.
          </p>
        </div>
        <SeedEmptyState isAdmin={ctx.isAdmin} hasNiches={false} />
      </div>
    );
  }

  const initialNiches = await fetchNiches({
    shortlist_only: true,
    search: '',
    countries: ['US', 'CA', 'UK', 'AU'],
  });

  return (
    <div className="px-6 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Niche Explorer
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse shortlist and full NAICS taxonomy. Click a card for details.
        </p>
      </div>
      <NicheGrid initialNiches={initialNiches} isAdmin={ctx.isAdmin} />
    </div>
  );
}
