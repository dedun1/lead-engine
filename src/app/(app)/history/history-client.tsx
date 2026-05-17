'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { parseHistorySearchParams } from '@/lib/history/parse-params';
import type { ActivityFeedEntry, ActivityFeedResult } from '@/lib/history/types';
import { LeadDetailDrawer } from '../pipeline/lead-detail-drawer';
import { fetchActivityFeedAction } from './actions';
import { HistoryFilters } from './history-filters';
import { FeedList } from './feed-list';

type Member = { id: string; display_name: string | null; email: string };
type Niche = { id: string; name: string };

export function HistoryClient({
  initial,
  members,
  niches,
  currentUserId,
  isAdmin,
  teamMembers,
}: {
  initial: ActivityFeedResult;
  members: Member[];
  niches: Niche[];
  currentUserId: string | null;
  isAdmin: boolean;
  teamMembers: Member[];
}) {
  const searchParams = useSearchParams();
  const skipFirstRef = useRef(true);
  const [entries, setEntries] = useState<ActivityFeedEntry[]>(initial.entries);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const params = parseHistorySearchParams(
      new URLSearchParams(searchParams.toString()),
      currentUserId,
    );
    const result = await fetchActivityFeedAction(params);
    setEntries(result.entries);
    setCursor(result.nextCursor);
    setLoading(false);
  }, [searchParams, currentUserId]);

  useEffect(() => {
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }
    void refetch();
  }, [refetch]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const params = parseHistorySearchParams(
      new URLSearchParams(searchParams.toString()),
      currentUserId,
    );
    params.cursor = cursor;
    const result = await fetchActivityFeedAction(params);
    setEntries((prev) => [...prev, ...result.entries]);
    setCursor(result.nextCursor);
    setLoadingMore(false);
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>
      <HistoryFilters
        members={members}
        niches={niches}
        currentUserId={currentUserId}
      />
      <div className="mt-6">
        <FeedList
          entries={entries}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={Boolean(cursor)}
          onLoadMore={() => void loadMore()}
          onOpenLead={setDrawerLeadId}
        />
      </div>

      <LeadDetailDrawer
        leadId={drawerLeadId}
        open={Boolean(drawerLeadId)}
        isAdmin={isAdmin}
        teamMembers={teamMembers}
        initialTab="activity"
        onClose={() => setDrawerLeadId(null)}
        onRefresh={() => void refetch()}
      />
    </>
  );
}
