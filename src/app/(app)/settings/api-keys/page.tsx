import { EmptyState } from '@/components/shell/empty-state';

export default function ApiKeysPage() {
  return (
    <EmptyState
      phaseLabel="Phase 1"
      title="API Keys"
      description="Add your API keys to start generating leads. At minimum: Anthropic. Other keys optional. The encrypted-at-rest form ships in the Phase 1 settings prompt."
    />
  );
}
