'use client';

import { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { LeadDetail } from '@/lib/pipeline/types';
import { formatActivityDescription } from '@/lib/pipeline/activity-text';

type Filter = 'all' | 'call' | 'status_change' | 'note_added' | 'enrichment_added';

export function LeadActivityTab({ lead }: { lead: LeadDetail }) {
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(() => {
    const list = lead.activities ?? [];
    if (filter === 'all') return list;
    if (filter === 'enrichment_added') {
      return list.filter((a) => a.activity_type === 'enrichment_added');
    }
    return list.filter((a) => a.activity_type === filter);
  }, [lead.activities, filter]);

  if (!lead.activities?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity yet. First action will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        {(
          [
            ['all', 'All'],
            ['call', 'Calls'],
            ['status_change', 'Status'],
            ['note_added', 'Notes'],
            ['enrichment_added', 'Enrichment'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-2 py-1 ${filter === key ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="space-y-4 border-l pl-4">
        {items.map((a) => (
          <li key={a.id} className="relative">
            <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground">
                    {a.created_at
                      ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true })
                      : '—'}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  {a.created_at ? format(new Date(a.created_at), 'PPpp') : ''}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-sm font-medium">{formatActivityDescription(a)}</p>
            {a.payload && Object.keys(a.payload as object).length > 0 && (
              <pre className="mt-1 max-h-24 overflow-auto rounded bg-muted p-2 text-[10px]">
                {JSON.stringify(a.payload, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
