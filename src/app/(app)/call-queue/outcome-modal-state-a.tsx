'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TopOutcome } from '@/lib/calls/types';

const OUTCOMES: {
  value: TopOutcome;
  label: string;
  hint: string;
  className: string;
}[] = [
  {
    value: 'answered',
    label: 'Answered',
    hint: 'They picked up',
    className: 'bg-chart-3 hover:bg-chart-3/90 text-primary-foreground',
  },
  {
    value: 'no_answer',
    label: 'No answer',
    hint: 'Rang out / no voicemail',
    className: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
  },
  {
    value: 'voicemail',
    label: 'Voicemail',
    hint: 'Left a voicemail',
    className: 'bg-warning hover:bg-warning/90 text-primary-foreground',
  },
  {
    value: 'busy',
    label: 'Busy',
    hint: 'Busy signal',
    className: 'bg-chart-5 hover:bg-chart-5/90 text-primary-foreground',
  },
  {
    value: 'disconnected',
    label: 'Disconnected',
    hint: 'Dead / out of service',
    className: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  },
  {
    value: 'wrong_number',
    label: 'Wrong number',
    hint: 'Wrong person or business',
    className: 'bg-destructive/80 hover:bg-destructive text-destructive-foreground',
  },
];

type Props = {
  onSelect: (outcome: TopOutcome) => void;
};

export function OutcomeModalStateA({ onSelect }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {OUTCOMES.map((o) => (
        <Button
          key={o.value}
          type="button"
          variant="secondary"
          className={cn('h-auto flex-col items-start py-3 text-left', o.className)}
          onClick={() => onSelect(o.value)}
        >
          <span className="font-semibold">{o.label}</span>
          <span className="text-xs opacity-90">{o.hint}</span>
        </Button>
      ))}
    </div>
  );
}
