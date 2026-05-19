'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { SubOutcome } from '@/lib/calls/types';
import {
  subOutcomeNeedsDateOnly,
  subOutcomeNeedsDateTime,
} from '@/lib/calls/types';
import { OutcomeScheduleFields } from './outcome-schedule-fields';

const SUB_OPTIONS: {
  value: SubOutcome;
  label: string;
  className: string;
}[] = [
  { value: 'interested', label: 'Interested', className: 'text-chart-3' },
  { value: 'not_interested', label: 'Not interested', className: 'text-muted-foreground' },
  {
    value: 'follow_up_requested',
    label: 'Follow up requested',
    className: 'text-warning',
  },
  {
    value: 'booked_meeting',
    label: 'Booked meeting',
    className: 'text-chart-3 font-semibold',
  },
  {
    value: 'price_objection',
    label: 'Price objection',
    className: 'text-chart-4',
  },
  {
    value: 'already_has_solution',
    label: 'Already has solution',
    className: 'text-muted-foreground',
  },
  {
    value: 'decision_maker_unavailable',
    label: 'Decision maker not available',
    className: 'text-warning',
  },
  { value: 'hostile', label: 'Hostile', className: 'text-destructive' },
  {
    value: 'dnc_requested',
    label: 'DNC requested',
    className: 'text-destructive font-semibold',
  },
];

type Props = {
  subOutcome: SubOutcome | null;
  onSubOutcomeChange: (v: SubOutcome) => void;
  scheduleDate: Date | undefined;
  onScheduleDateChange: (d: Date | undefined) => void;
  scheduleTime: string;
  onScheduleTimeChange: (t: string) => void;
  canContinue: boolean;
  onContinue: () => void;
};

export function OutcomeModalStateB({
  subOutcome,
  onSubOutcomeChange,
  scheduleDate,
  onScheduleDateChange,
  scheduleTime,
  onScheduleTimeChange,
  canContinue,
  onContinue,
}: Props) {
  const needsDate = subOutcome && subOutcomeNeedsDateOnly(subOutcome);
  const needsDateTime = subOutcome && subOutcomeNeedsDateTime(subOutcome);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        They answered — what was the result?
      </p>
      <RadioGroup
        value={subOutcome ?? ''}
        onValueChange={(v) => onSubOutcomeChange(v as SubOutcome)}
        className="gap-3"
      >
        {SUB_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={`sub-${opt.value}`} />
            <Label
              htmlFor={`sub-${opt.value}`}
              className={cn('cursor-pointer font-medium', opt.className)}
            >
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {needsDate && (
        <OutcomeScheduleFields
          label="Call back on"
          date={scheduleDate}
          onDateChange={onScheduleDateChange}
          timeValue={scheduleTime}
          onTimeChange={onScheduleTimeChange}
        />
      )}
      {needsDateTime && (
        <OutcomeScheduleFields
          label="Meeting date & time"
          date={scheduleDate}
          onDateChange={onScheduleDateChange}
          showTime
          timeValue={scheduleTime}
          onTimeChange={onScheduleTimeChange}
        />
      )}

      <Button
        type="button"
        className="w-full"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continue to notes
      </Button>
    </div>
  );
}
