'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { LeadDetail } from '@/lib/pipeline/types';

export function LeadRawTab({ lead }: { lead: LeadDetail }) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="text-sm font-medium">
        Full lead record (JSON)
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-2 max-h-[60vh] overflow-auto rounded-md bg-muted p-3 text-[11px]">
          {JSON.stringify(lead, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
