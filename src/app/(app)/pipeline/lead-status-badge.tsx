import { Badge } from '@/components/ui/badge';
import { STATUS_BADGE_CLASS, STATUS_LABELS } from '@/lib/pipeline/status';
import type { LeadStatus } from '@/lib/pipeline/types';
import { cn } from '@/lib/utils';

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('border-0 font-medium', STATUS_BADGE_CLASS[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
