'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { fetchLeadById } from '@/app/(app)/pipeline/actions-fetch';
import { formatForTelLink } from '@/lib/phone';
import { getQueueLeads, markLeadDeadInQueue } from '@/lib/queue/state';
import type { QueueFilter, QueueLeadRow } from '@/lib/queue/types';
import { useCallQueueKeyboard } from '@/hooks/use-call-queue-keyboard';
import { CallQueueRail } from './call-queue-rail';
import { CallQueueMain, NOTES_FIELD_ID } from './call-queue-main';
import { OutcomeModalStub } from './outcome-modal-stub';
import { ShortcutHelpDialog } from './shortcut-help-dialog';

type Props = {
  initialLeads: QueueLeadRow[];
  initialCalledToday: number;
  initialFilter: QueueFilter;
  isAdmin: boolean;
};

function parseIndex(raw: string | null, max: number): number {
  const n = parseInt(raw ?? '0', 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n, Math.max(0, max));
}

export function CallQueueClient({
  initialLeads,
  initialCalledToday,
  initialFilter,
  isAdmin,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [leads, setLeads] = useState(initialLeads);
  const [calledToday, setCalledToday] = useState(initialCalledToday);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>(initialFilter);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const queueIndex = parseIndex(
    searchParams.get('queue_index'),
    Math.max(0, leads.length - 1),
  );

  const currentLead = leads[queueIndex] ?? null;
  const atEnd = leads.length > 0 && queueIndex >= leads.length;
  const isEmpty = leads.length === 0;

  const syncUrl = useCallback(
    (index: number, filter: QueueFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('queue_index', String(index));
      params.set('queue_filter', filter);
      router.replace(`/call-queue?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const refreshQueue = useCallback(async (filter: QueueFilter) => {
    const result = await getQueueLeads(filter);
    setLeads(result.leads);
    setCalledToday(result.calledToday);
    return result;
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, leads.length));
      syncUrl(clamped, queueFilter);
    },
    [leads.length, queueFilter, syncUrl],
  );

  const goNext = useCallback(() => goToIndex(queueIndex + 1), [goToIndex, queueIndex]);
  const goPrev = useCallback(() => goToIndex(queueIndex - 1), [goToIndex, queueIndex]);

  const currentBusinessName = useMemo(
    () => currentLead?.business_name ?? null,
    [currentLead],
  );

  const triggerCall = useCallback(async () => {
    if (!currentLead) return;
    if (!currentLead.id) return;
    const full = await fetchLeadById(currentLead.id);
    if (!full?.business_phone) {
      toast.error('No phone number');
      return;
    }
    window.location.href = formatForTelLink(full.business_phone);
    setOutcomeOpen(true);
  }, [currentLead]);

  const onOutcomeSaved = useCallback(() => {
    startTransition(async () => {
      const result = await refreshQueue(queueFilter);
      const nextIdx = Math.min(queueIndex + 1, result.leads.length);
      syncUrl(nextIdx, queueFilter);
    });
    setCalledToday((c) => c + 1);
  }, [queueFilter, queueIndex, refreshQueue, syncUrl]);

  const skipDead = useCallback(() => {
    if (!currentLead) return;
    startTransition(async () => {
      const res = await markLeadDeadInQueue(currentLead.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const result = await refreshQueue(queueFilter);
      const nextIdx = Math.min(queueIndex, Math.max(0, result.leads.length - 1));
      syncUrl(nextIdx, queueFilter);
      toast.message('Marked dead — skipped');
    });
  }, [currentLead, queueFilter, queueIndex, refreshQueue, syncUrl]);

  const onFilterChange = (filter: QueueFilter) => {
    setQueueFilter(filter);
    startTransition(async () => {
      const result = await refreshQueue(filter);
      syncUrl(0, filter);
      if (result.leads.length === 0) setLeads([]);
    });
  };

  useCallQueueKeyboard({
    enabled: !isEmpty && !atEnd,
    onNext: goNext,
    onPrev: goPrev,
    onCall: () => void triggerCall(),
    onSkipDead: skipDead,
    onFocusNotes: () => {
      document.getElementById(NOTES_FIELD_ID)?.focus();
    },
    onShowHelp: () => setHelpOpen(true),
  });

  if (isEmpty) {
    return (
      <div className="flex h-[calc(100vh-1rem)] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="max-w-md text-muted-foreground">
          Queue is empty. Add leads to queue from /pipeline by setting status to
          &apos;queued&apos;.
        </p>
        <Button asChild variant="outline">
          <Link href="/pipeline">Go to Pipeline</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-[calc(100vh-1rem)] overflow-hidden"
      tabIndex={-1}
    >
      <CallQueueRail
        leads={leads}
        currentId={currentLead?.id ?? null}
        queueFilter={queueFilter}
        totalCount={leads.length}
        calledToday={calledToday}
        onSelect={(id) => {
          const idx = leads.findIndex((l) => l.id === id);
          if (idx >= 0) goToIndex(idx);
        }}
        onFilterChange={onFilterChange}
      />

      <CallQueueMain
        leadId={atEnd ? null : (currentLead?.id ?? null)}
        isAdmin={isAdmin}
        atEnd={atEnd}
        calledToday={calledToday}
        onCall={() => void triggerCall()}
        onPrev={goPrev}
        onNext={goNext}
      />

      <OutcomeModalStub
        open={outcomeOpen}
        leadId={currentLead?.id ?? null}
        businessName={currentBusinessName}
        onOpenChange={setOutcomeOpen}
        onSaved={onOutcomeSaved}
      />

      <ShortcutHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-4 right-4 text-xs text-muted-foreground hover:text-foreground"
      >
        Press ? for shortcuts
      </button>

      {pending && (
        <span className="pointer-events-none fixed top-2 right-2 text-xs text-muted-foreground">
          Updating…
        </span>
      )}
    </div>
  );
}
