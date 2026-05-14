import { EmptyState } from '@/components/shell/empty-state';

export default function PricingPage() {
  return (
    <EmptyState
      phaseLabel="Phase 1"
      title="Pricing Config"
      description="Per-source unit costs used by the cost estimator. Editable table lands in the Phase 1 settings prompt."
    />
  );
}
