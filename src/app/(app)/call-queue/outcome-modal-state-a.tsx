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
    className: 'bg-green-600 hover:bg-green-700 text-white',
  },
  {
    value: 'no_answer',
    label: 'No answer',
    hint: 'Rang out / no voicemail',
    className: 'bg-gray-500 hover:bg-gray-600 text-white',
  },
  {
    value: 'voicemail',
    label: 'Voicemail',
    hint: 'Left a voicemail',
    className: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  },
  {
    value: 'busy',
    label: 'Busy',
    hint: 'Busy signal',
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  {
    value: 'disconnected',
    label: 'Disconnected',
    hint: 'Dead / out of service',
    className: 'bg-red-600 hover:bg-red-700 text-white',
  },
  {
    value: 'wrong_number',
    label: 'Wrong number',
    hint: 'Wrong person or business',
    className: 'bg-red-700 hover:bg-red-800 text-white',
  },
];

type Props = {
  onSelect: (outcome: TopOutcome) => void;
};

export function OutcomeModalStateA({ onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">What happened on this call?</p>
      {OUTCOMES.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="lg"
          className={cn('h-auto flex-col items-start py-3', o.className)}
          onClick={() => onSelect(o.value)}
        >
          <span className="text-base font-semibold">{o.label}</span>
          <span className="text-xs font-normal opacity-90">{o.hint}</span>
        </Button>
      ))}
    </div>
  );
}
