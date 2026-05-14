import { EmptyState } from '@/components/shell/empty-state';

export default function CallQueuePage() {
  return (
    <EmptyState
      phaseLabel="Phase 5"
      title="Call Queue"
      description="No leads queued. Add leads to the queue from the Pipeline once you've generated some."
    />
  );
}
