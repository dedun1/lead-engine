'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildNextContactIso } from '@/lib/calls/build-next-contact';
import { elapsedSecondsSince } from '@/lib/calls/format-duration';
import { saveCallOutcome } from '@/lib/calls/save-outcome';
import type {
  CallNoteTag,
  OutcomeModalStep,
  SubOutcome,
  TopOutcome,
} from '@/lib/calls/types';
import {
  subOutcomeNeedsDateOnly,
  subOutcomeNeedsDateTime,
} from '@/lib/calls/types';
import { useCallDurationTimer } from '@/hooks/use-call-duration-timer';
import { OutcomeModalStateA } from './outcome-modal-state-a';
import { OutcomeModalStateB } from './outcome-modal-state-b';
import { OutcomeModalStateC } from './outcome-modal-state-c';

type Props = {
  open: boolean;
  leadId: string | null;
  businessName: string | null;
  calledAt: string | null;
  onSaved: () => void;
};

const OUTCOME_LABELS: Record<TopOutcome, string> = {
  answered: 'Answered',
  no_answer: 'No answer',
  voicemail: 'Voicemail',
  busy: 'Busy',
  disconnected: 'Disconnected',
  wrong_number: 'Wrong number',
};

const SUB_LABELS: Record<SubOutcome, string> = {
  interested: 'Interested',
  not_interested: 'Not interested',
  follow_up_requested: 'Follow up requested',
  booked_meeting: 'Booked meeting',
  price_objection: 'Price objection',
  already_has_solution: 'Already has solution',
  decision_maker_unavailable: 'Decision maker unavailable',
  hostile: 'Hostile',
  dnc_requested: 'DNC requested',
};

function buildTags(
  selected: CallNoteTag[],
  competitorName: string,
): string[] {
  return selected.map((tag) => {
    if (tag === 'Competitor mentioned' && competitorName.trim()) {
      return `competitor mentioned: ${competitorName.trim()}`;
    }
    return tag.toLowerCase();
  });
}

export function OutcomeModal({
  open,
  leadId,
  businessName,
  calledAt,
  onSaved,
}: Props) {
  const [step, setStep] = useState<OutcomeModalStep>('outcome');
  const [topOutcome, setTopOutcome] = useState<TopOutcome | null>(null);
  const [subOutcome, setSubOutcome] = useState<SubOutcome | null>(null);
  const [frozenSeconds, setFrozenSeconds] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<CallNoteTag[]>([]);
  const [competitorName, setCompetitorName] = useState('');
  const [sentiment, setSentiment] = useState<number | null>(null);
  const [sentimentTouched, setSentimentTouched] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [saving, setSaving] = useState(false);

  const timerFrozen = topOutcome != null;
  const timerDisplay = useCallDurationTimer(
    calledAt,
    timerFrozen,
    frozenSeconds,
  );

  const resetForm = useCallback(() => {
    setStep('outcome');
    setTopOutcome(null);
    setSubOutcome(null);
    setFrozenSeconds(null);
    setNotes('');
    setSelectedTags([]);
    setCompetitorName('');
    setSentiment(null);
    setSentimentTouched(false);
    setScheduleDate(undefined);
    setScheduleTime('09:00');
    setSaving(false);
  }, []);

  useEffect(() => {
    if (open) resetForm();
  }, [open, leadId, resetForm]);

  const pickTopOutcome = (outcome: TopOutcome) => {
    if (calledAt && frozenSeconds == null) {
      setFrozenSeconds(elapsedSecondsSince(calledAt));
    }
    setTopOutcome(outcome);
    if (outcome === 'answered') {
      setStep('sub_outcome');
    } else {
      setSubOutcome(null);
      setStep('notes');
    }
  };

  const subCanContinue = useMemo(() => {
    if (!subOutcome) return false;
    if (subOutcomeNeedsDateTime(subOutcome)) return Boolean(scheduleDate);
    if (subOutcomeNeedsDateOnly(subOutcome)) return Boolean(scheduleDate);
    return true;
  }, [subOutcome, scheduleDate]);

  const outcomeSummary = useMemo(() => {
    if (!topOutcome) return '';
    if (topOutcome === 'answered' && subOutcome) {
      return `${OUTCOME_LABELS[topOutcome]} → ${SUB_LABELS[subOutcome]}`;
    }
    return OUTCOME_LABELS[topOutcome];
  }, [topOutcome, subOutcome]);

  const canSave =
    topOutcome != null &&
    (topOutcome !== 'answered' || subOutcome != null) &&
    subCanContinue;

  const handleSave = async () => {
    if (!leadId || !calledAt || !topOutcome || !canSave) return;

    setSaving(true);
    const duration =
      frozenSeconds ?? elapsedSecondsSince(calledAt);
    const nextContact =
      subOutcome &&
      (subOutcomeNeedsDateTime(subOutcome) ||
        subOutcomeNeedsDateOnly(subOutcome))
        ? buildNextContactIso(
            scheduleDate,
            scheduleTime,
            subOutcomeNeedsDateTime(subOutcome),
          )
        : null;

    const res = await saveCallOutcome({
      leadId,
      calledAt,
      durationSeconds: duration,
      outcome: topOutcome,
      subOutcome: topOutcome === 'answered' ? subOutcome : null,
      notes: notes.trim() || null,
      tags: buildTags(selectedTags, competitorName),
      sentimentScore: sentimentTouched ? sentiment : null,
      nextContactDate: nextContact,
    });

    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success('Call outcome saved');
    resetForm();
    onSaved();
  };

  const toggleTag = (tag: CallNoteTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[90vh] max-w-md overflow-y-auto sm:max-w-lg [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            Call outcome for {businessName ?? 'this lead'}
          </DialogTitle>
          <DialogDescription className="font-mono text-base tabular-nums text-foreground">
            Duration: {timerDisplay}
          </DialogDescription>
        </DialogHeader>

        {step === 'outcome' && (
          <OutcomeModalStateA onSelect={pickTopOutcome} />
        )}

        {step === 'sub_outcome' && (
          <OutcomeModalStateB
            subOutcome={subOutcome}
            onSubOutcomeChange={setSubOutcome}
            scheduleDate={scheduleDate}
            onScheduleDateChange={setScheduleDate}
            scheduleTime={scheduleTime}
            onScheduleTimeChange={setScheduleTime}
            canContinue={subCanContinue}
            onContinue={() => setStep('notes')}
          />
        )}

        {step === 'notes' && (
          <OutcomeModalStateC
            notes={notes}
            onNotesChange={setNotes}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            competitorName={competitorName}
            onCompetitorNameChange={setCompetitorName}
            sentiment={sentiment}
            onSentimentChange={(v) => {
              setSentimentTouched(true);
              setSentiment(v);
            }}
            saving={saving}
            canSave={canSave}
            onSave={() => void handleSave()}
            outcomeSummary={outcomeSummary}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
