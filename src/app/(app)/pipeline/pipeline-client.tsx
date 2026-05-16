'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PipelineToolbar } from './pipeline-toolbar';
import type {
  FetchLeadsResult,
  PipelineFilters,
  PitchingNiche,
} from '@/lib/pipeline/types';
import { parsePipelineFilters, filtersToSearchParams } from '@/lib/pipeline/parse-filters';
import { PipelineFiltersBar } from './pipeline-filters';
import { PipelineTable } from './pipeline-table';
import { PipelineCards } from './pipeline-cards';
import { LeadDetailDrawer } from './lead-detail-drawer';
import { fetchLeads } from './actions-fetch';

type TeamMember = { id: string; display_name: string | null; email: string };

type Props = {
  initial: FetchLeadsResult;
  niches: PitchingNiche[];
  teamMembers: TeamMember[];
  isAdmin: boolean;
};

export function PipelineClient({
  initial,
  niches,
  teamMembers,
  isAdmin,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<PipelineFilters>(() =>
    parsePipelineFilters(Object.fromEntries(searchParams.entries())),
  );
  const [data, setData] = useState(initial);
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(
    searchParams.get('lead'),
  );
  const [loading, setLoading] = useState(false);

  const sort = filters.sort ?? 'created_at';
  const sortDir = filters.sortDir ?? 'desc';

  const reload = useCallback(async () => {
    setLoading(true);
    const next = await fetchLeads(filters);
    setData(next);
    setLoading(false);
  }, [filters]);

  const openLead = (id: string) => {
    setDrawerId(id);
    const p = filtersToSearchParams(filters);
    p.set('lead', id);
    router.replace(`/pipeline?${p.toString()}`, { scroll: false });
  };

  const closeDrawer = () => {
    setDrawerId(null);
    const p = filtersToSearchParams(filters);
    router.replace(p.toString() ? `/pipeline?${p.toString()}` : '/pipeline', {
      scroll: false,
    });
  };

  const onSort = (col: string) => {
    const nextDir: 'asc' | 'desc' =
      sort === col && sortDir === 'desc' ? 'asc' : 'desc';
    const next: PipelineFilters = {
      ...filters,
      sort: col as PipelineFilters['sort'],
      sortDir: nextDir,
      cursor: undefined,
    };
    setFilters(next);
    void fetchLeads(next).then(setData);
  };

  const onFiltersChange = (next: PipelineFilters) => {
    setFilters(next);
    void fetchLeads(next).then(setData);
  };

  if (data.totalCount === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-8 py-16 text-center">
        <h2 className="text-xl font-semibold">No leads yet</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Go to /generator to scrape your first batch.
        </p>
        <Button asChild className="mt-6">
          <Link href="/generator">Open Lead Generator</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PipelineFiltersBar
        filters={filters}
        niches={niches}
        onFiltersChange={onFiltersChange}
      />

      <PipelineToolbar
        shown={data.leads.length}
        total={data.totalCount}
        loading={loading}
        view={view}
        selectedCount={selected.size}
        onRefresh={() => void reload()}
        onViewTable={() => setView('table')}
        onViewCards={() => setView('cards')}
      />

      <div className="mt-4 rounded-lg border">
        {view === 'table' ? (
          <PipelineTable
            leads={data.leads}
            selected={selected}
            onSelect={(id, checked) => {
              setSelected((prev) => {
                const n = new Set(prev);
                if (checked) n.add(id);
                else n.delete(id);
                return n;
              });
            }}
            onSelectAll={(checked) => {
              setSelected(checked ? new Set(data.leads.map((l) => l.id)) : new Set());
            }}
            onOpenLead={openLead}
            onAssign={openLead}
            onBlock={openLead}
            sort={sort}
            sortDir={sortDir}
            onSort={onSort}
          />
        ) : (
          <div className="p-4">
            <PipelineCards leads={data.leads} onOpenLead={openLead} />
          </div>
        )}
      </div>

      {data.nextCursor && (
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            const next = { ...filters, cursor: data.nextCursor! };
            setFilters(next);
            void fetchLeads(next).then((r) =>
              setData((prev) => ({
                ...r,
                leads: [...prev.leads, ...r.leads],
              })),
            );
          }}
        >
          Load more
        </Button>
      )}

      <LeadDetailDrawer
        leadId={drawerId}
        open={Boolean(drawerId)}
        isAdmin={isAdmin}
        teamMembers={teamMembers}
        onClose={closeDrawer}
        onRefresh={() => void reload()}
      />
    </>
  );
}
