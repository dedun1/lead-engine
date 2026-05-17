import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/permissions';
import {
  fetchBlocklistBlockers,
  fetchBlocklistPage,
} from '@/lib/settings/fetch-blocklist';
import { BlocklistTable } from './blocklist-table';

type SearchParams = {
  cursor?: string;
  blocked_by?: string | string[];
};

export default async function BlocklistPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const blockedBy = Array.isArray(searchParams.blocked_by)
    ? searchParams.blocked_by
    : searchParams.blocked_by
      ? [searchParams.blocked_by]
      : undefined;

  const [page, blockers] = await Promise.all([
    fetchBlocklistPage({
      cursor: searchParams.cursor,
      blockedBy,
    }),
    fetchBlocklistBlockers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Blocklist Review</h1>
        <p className="text-sm text-muted-foreground">
          {page.totalCount} blocked fingerprint{page.totalCount === 1 ? '' : 's'} (last 30
          days default). {!ctx.isAdmin && 'Read-only — admin required for actions.'}
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <BlocklistTable
          rows={page.rows}
          nextCursor={page.nextCursor}
          isAdmin={ctx.isAdmin}
          blockers={blockers}
        />
      </Suspense>
    </div>
  );
}
