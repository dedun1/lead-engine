import { EmptyState } from '@/components/shell/empty-state';

export default function HistoryPage() {
  return (
    <EmptyState
      phaseLabel="Phase 3"
      title="Generation History"
      description="No generation jobs yet. Past jobs — cost, dedup skips, blocklist skips — appear here once you generate leads."
    />
  );
}
