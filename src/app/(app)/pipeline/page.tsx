import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/permissions';
import { parsePipelineFilters } from '@/lib/pipeline/parse-filters';
import {
  fetchLeads,
  fetchPitchingNiches,
  fetchTeamMembers,
} from './actions-fetch';
import { PipelineClient } from './pipeline-client';

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

async function PipelinePageInner({ searchParams }: Props) {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const filters = parsePipelineFilters(searchParams);
  const [initial, niches, teamMembers] = await Promise.all([
    fetchLeads(filters),
    fetchPitchingNiches(),
    fetchTeamMembers(),
  ]);

  return (
    <div className="px-6 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Lead Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Research leads before calling. Click a row to open details.
        </p>
      </div>
      <PipelineClient
        initial={initial}
        niches={niches}
        teamMembers={teamMembers}
        isAdmin={ctx.isAdmin}
      />
    </div>
  );
}

export default function PipelinePage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-10 text-sm text-muted-foreground">
          Loading pipeline…
        </div>
      }
    >
      <PipelinePageInner {...props} />
    </Suspense>
  );
}
