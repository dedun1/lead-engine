'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRightLeft,
  Ban,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  PlusCircle,
  Search,
  StickyNote,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ActivityFeedEntry } from '@/lib/history/types';
import { entryMainLine, entrySubLine } from '@/lib/history/entry-copy';
import { SEVERITY_CLASS } from '@/lib/triggers/display';

function CallIcon({ outcome }: { outcome: string | null }) {
  const o = outcome ?? '';
  if (o === 'answered') return <PhoneCall className="h-5 w-5 text-emerald-600" />;
  if (o === 'voicemail') return <PhoneForwarded className="h-5 w-5 text-amber-600" />;
  if (o === 'wrong_number') return <PhoneOff className="h-5 w-5 text-slate-500" />;
  return <Phone className="h-5 w-5 text-red-600" />;
}

function KindIcon({ entry }: { entry: ActivityFeedEntry }) {
  if (entry.kind === 'call') {
    return <CallIcon outcome={String(entry.payload.outcome ?? '')} />;
  }
  if (entry.kind === 'status_change') {
    return <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />;
  }
  if (entry.kind === 'enrichment_added') {
    return <Search className="h-5 w-5 text-blue-600" />;
  }
  if (entry.kind === 'note_added') {
    return <StickyNote className="h-5 w-5 text-amber-700" />;
  }
  if (entry.kind === 'lead_blocked') {
    return <Ban className="h-5 w-5 text-red-600" />;
  }
  if (entry.kind === 'generation') {
    return <PlusCircle className="h-5 w-5 text-primary" />;
  }
  if (entry.kind === 'trigger') {
    return <Zap className="h-5 w-5 text-orange-500" />;
  }
  return <Phone className="h-5 w-5" />;
}

function sentimentClass(score: number): string {
  if (score >= 1) return 'bg-emerald-500/15 text-emerald-800';
  if (score <= -1) return 'bg-red-500/15 text-red-800';
  return 'bg-slate-500/15 text-slate-700';
}

type Props = {
  entry: ActivityFeedEntry;
  onOpenLead: (leadId: string, tab?: 'activity') => void;
};

export function HistoryEntry({ entry, onOpenLead }: Props) {
  const at = new Date(entry.occurred_at);
  const sub = entrySubLine(entry);
  const tags = Array.isArray(entry.payload.tags)
    ? (entry.payload.tags as string[])
    : [];
  const sentiment =
    typeof entry.payload.sentiment_score === 'number'
      ? entry.payload.sentiment_score
      : null;
  const duration =
    entry.kind === 'call' &&
    entry.payload.outcome === 'answered' &&
    typeof entry.payload.duration_seconds === 'number'
      ? entry.payload.duration_seconds
      : null;

  const href =
    entry.kind === 'generation'
      ? `/pipeline?generation_job_id=${entry.source_id}`
      : undefined;

  function handleClick() {
    if (entry.kind === 'generation') return;
    if (entry.lead_id) onOpenLead(entry.lead_id, 'activity');
  }

  const inner = (
    <article
      className={cn(
        'flex gap-3 rounded-lg border p-4 transition-colors',
        entry.lead_id || entry.kind === 'generation'
          ? 'cursor-pointer hover:bg-muted/40'
          : '',
      )}
      onClick={entry.kind === 'generation' ? undefined : handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role={entry.lead_id ? 'button' : undefined}
      tabIndex={entry.lead_id ? 0 : undefined}
    >
      <div className="pt-0.5 shrink-0">
        <KindIcon entry={entry} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-snug">{entryMainLine(entry)}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {entry.kind === 'call' && (
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
            {sentiment != null && (
              <Badge className={sentimentClass(sentiment)}>{sentiment}</Badge>
            )}
            {duration != null && (
              <span className="text-[10px] text-muted-foreground">{duration}s</span>
            )}
          </div>
        )}
        {entry.kind === 'trigger' && entry.payload.severity != null && (
          <Badge
            className={
              SEVERITY_CLASS[String(entry.payload.severity)] ?? 'bg-muted'
            }
          >
            {String(entry.payload.severity)}
          </Badge>
        )}
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(at, { addSuffix: true })}
          </TooltipTrigger>
          <TooltipContent>{at.toLocaleString()}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </article>
  );

  if (entry.kind === 'generation' && href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
