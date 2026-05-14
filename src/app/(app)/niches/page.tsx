import { EmptyState } from '@/components/shell/empty-state';

export default function NichesPage() {
  return (
    <EmptyState
      phaseLabel="Phase 2"
      title="Niche Explorer"
      description="No niches seeded yet. Run pnpm seed:niches after the NAICS CSV is in place — see BUILD_INSTRUCTIONS section 8."
    />
  );
}
