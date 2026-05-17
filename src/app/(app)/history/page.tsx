import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { getActivityFeed } from '@/lib/history/feed';
import { parseHistoryParams } from '@/lib/history/parse-params';
import type { HistorySearchParams } from '@/lib/history/parse-params';
import { fetchTeamMembers } from '../pipeline/actions-fetch';
import { HistoryClient } from './history-client';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: HistorySearchParams;
};

async function HistoryPageInner({ searchParams }: Props) {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const feedParams = parseHistoryParams(searchParams, ctx.user.id);
  const supabase = createClient();

  const [initial, teamMembers, membersRes, nichesRes] = await Promise.all([
    getActivityFeed(feedParams),
    fetchTeamMembers(),
    supabase
      .from('team_members')
      .select('id, display_name, email')
      .eq('is_active', true)
      .order('display_name'),
    supabase.from('niches').select('id, name').order('name'),
  ]);
  const members = membersRes.data;
  const niches = nichesRes.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Activity History</h1>
        <p className="text-sm text-muted-foreground">
          Calls, status changes, enrichments, and team activity — newest first.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading filters…</p>}>
        <HistoryClient
          initial={initial}
          members={members ?? []}
          niches={niches ?? []}
          currentUserId={ctx.user.id}
          isAdmin={ctx.isAdmin}
          teamMembers={teamMembers}
        />
      </Suspense>
    </div>
  );
}

export default function HistoryPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-10 text-sm text-muted-foreground">
          Loading activity…
        </div>
      }
    >
      <HistoryPageInner {...props} />
    </Suspense>
  );
}
