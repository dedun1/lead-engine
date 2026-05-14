import { EmptyState } from '@/components/shell/empty-state';

export default function HealthPage() {
  return (
    <EmptyState
      phaseLabel="Phase 9"
      title="Source Health"
      description="Scraper status panel (green / yellow / red per source). Wired up in Phase 9 when real scrapers exist."
    />
  );
}
