import { BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';

const UNLOCK_CALLS = 5;

export function DashboardLowCallsBanner({ callsMade }: { callsMade: number }) {
  if (callsMade >= UNLOCK_CALLS) return null;

  return (
    <EmptyState
      icon={BarChart3}
      headline="Make 5 more calls to unlock metrics"
      description="Your dashboard shows opener performance, niche profitability, and call timing patterns. We need at least 5 calls to start."
      ctaLabel="Open Call Queue"
      ctaHref="/call-queue"
    >
      <p className="mt-4 text-sm font-medium tabular-nums">
        {callsMade} / {UNLOCK_CALLS} calls made
      </p>
      <Progress value={(callsMade / UNLOCK_CALLS) * 100} className="mt-2 h-2 w-48" />
    </EmptyState>
  );
}
