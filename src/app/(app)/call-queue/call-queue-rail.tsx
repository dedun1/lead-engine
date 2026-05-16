'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/lib/pipeline/types';
import { STATUS_BADGE_CLASS } from '@/lib/pipeline/status';
import type { QueueFilter, QueueLeadRow } from '@/lib/queue/types';

const ROW_HEIGHT = 52;
const VIRTUAL_THRESHOLD = 100;

const FILTER_CHIPS: { id: QueueFilter; label: string }[] = [
  { id: 'all', label: 'All in queue' },
  { id: 'mine', label: 'My queue' },
  { id: 'unassigned', label: 'Unassigned' },
];

function statusDotClass(status: LeadStatus): string {
  const badge = STATUS_BADGE_CLASS[status];
  if (badge.includes('purple')) return 'bg-purple-500';
  if (badge.includes('yellow')) return 'bg-yellow-500';
  return 'bg-muted-foreground';
}

type Props = {
  leads: QueueLeadRow[];
  currentId: string | null;
  queueFilter: QueueFilter;
  totalCount: number;
  calledToday: number;
  onSelect: (id: string) => void;
  onFilterChange: (filter: QueueFilter) => void;
};

export function CallQueueRail({
  leads,
  currentId,
  queueFilter,
  totalCount,
  calledToday,
  onSelect,
  onFilterChange,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const useVirtual = leads.length > VIRTUAL_THRESHOLD;

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) setScrollTop(el.scrollTop);
  }, []);

  useEffect(() => {
    if (!currentId || !scrollRef.current) return;
    const idx = leads.findIndex((l) => l.id === currentId);
    if (idx < 0) return;
    const top = idx * ROW_HEIGHT;
    const el = scrollRef.current;
    if (top < el.scrollTop || top > el.scrollTop + el.clientHeight - ROW_HEIGHT) {
      el.scrollTop = top;
    }
  }, [currentId, leads]);

  const viewportH = scrollRef.current?.clientHeight ?? 480;
  const startIdx = useVirtual ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2) : 0;
  const visibleCount = useVirtual
    ? Math.ceil(viewportH / ROW_HEIGHT) + 4
    : leads.length;
  const slice = useVirtual
    ? leads.slice(startIdx, startIdx + visibleCount)
    : leads;

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-r bg-muted/20">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">
          Queue: {totalCount} lead{totalCount === 1 ? '' : 's'} · {calledToday}{' '}
          called today
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onFilterChange(chip.id)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                queueFilter === chip.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {useVirtual ? (
          <div
            className="relative"
            style={{ height: leads.length * ROW_HEIGHT }}
          >
            {slice.map((lead, i) => {
              const absoluteIdx = startIdx + i;
              return (
                <QueueRow
                  key={lead.id}
                  lead={lead}
                  active={lead.id === currentId}
                  style={{ top: absoluteIdx * ROW_HEIGHT }}
                  absolute
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        ) : (
          slice.map((lead) => (
            <QueueRow
              key={lead.id}
              lead={lead}
              active={lead.id === currentId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function QueueRow({
  lead,
  active,
  onSelect,
  style,
  absolute,
}: {
  lead: QueueLeadRow;
  active: boolean;
  onSelect: (id: string) => void;
  style?: React.CSSProperties;
  absolute?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lead.id)}
      style={style}
      className={cn(
        'flex w-full items-center gap-2 border-b px-3 py-3 text-left text-sm transition-colors',
        absolute && 'absolute left-0 right-0 h-[52px]',
        active ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50',
      )}
    >
      <span
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          statusDotClass(lead.status),
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate font-medium">{lead.business_name}</span>
      {lead.city && (
        <span className="shrink-0 truncate text-xs text-muted-foreground">
          {lead.city}
        </span>
      )}
    </button>
  );
}
