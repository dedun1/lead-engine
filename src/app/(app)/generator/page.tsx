import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shell/empty-state';

export default function GeneratorPage() {
  return (
    <EmptyState
      phaseLabel="Phase 3"
      title="Lead Generator"
      description="Add an Anthropic API key in Settings, then favorite or mark a niche as actively pitching to start generating leads."
      action={
        <Button asChild variant="outline">
          <Link href="/settings/api-keys">Add API key</Link>
        </Button>
      }
    />
  );
}
