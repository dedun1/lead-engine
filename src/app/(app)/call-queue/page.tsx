import { Suspense } from 'react';
import { getSessionContext } from '@/lib/permissions';
import { getQueueLeads } from '@/lib/queue/state';
import type { QueueFilter } from '@/lib/queue/types';
import { CallQueueClient } from './call-queue-client';

function parseFilter(raw: string | undefined): QueueFilter {
  if (raw === 'mine' || raw === 'unassigned') return raw;
  return 'all';
}

export default async function CallQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ queue_index?: string; queue_filter?: string }>;
}) {
  const params = await searchParams;
  const filter = parseFilter(params.queue_filter);
  const ctx = await getSessionContext();
  const { leads, calledToday } = await getQueueLeads(filter);

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-1rem)] items-center justify-center text-muted-foreground">
          Loading call queue…
        </div>
      }
    >
      <CallQueueClient
        initialLeads={leads}
        initialCalledToday={calledToday}
        initialFilter={filter}
        isAdmin={ctx?.isAdmin ?? false}
      />
    </Suspense>
  );
}
