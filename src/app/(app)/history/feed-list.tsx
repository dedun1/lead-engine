'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActivityFeedEntry } from '@/lib/history/types';
import { HistoryEntry } from './entry';

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[88px] w-full rounded-lg" />
      ))}
    </div>
  );
}

export function FeedList({
  entries,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onOpenLead,
}: {
  entries: ActivityFeedEntry[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onOpenLead: (leadId: string) => void;
}) {
  if (loading) return <FeedSkeleton />;

  if (!entries.length) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No activity in this period. Adjust filters or make some calls.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <HistoryEntry
          key={`${entry.kind}-${entry.source_id}`}
          entry={entry}
          onOpenLead={(id) => onOpenLead(id)}
        />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={() => onLoadMore()}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
