import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shell/empty-state';

export default function PipelinePage() {
  return (
    <EmptyState
      phaseLabel="Phase 5"
      title="Lead Pipeline"
      description="No leads yet. Generate your first batch from the Lead Generator."
      action={
        <Button asChild>
          <Link href="/generator">Generate your first leads</Link>
        </Button>
      }
    />
  );
}
