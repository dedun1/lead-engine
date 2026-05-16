'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { OpenerVariantRow } from '@/lib/ai/opener-types';
import { setLeadCurrentOpener } from '@/lib/opener/actions';

type Props = {
  leadId: string;
  baselines: OpenerVariantRow[];
  currentVariantId: string | null;
  onChanged: () => void;
};

export function OpenerBaselineSection({
  leadId,
  baselines,
  currentVariantId,
  onChanged,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (baselines.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No baselines yet. Admin must generate baseline openers from Niche Explorer
        when marking the niche as actively pitching.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="text-sm font-medium text-primary underline"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Hide' : 'Show'} baseline variants ({baselines.length})
      </button>
      {expanded && (
        <RadioGroup
          value={currentVariantId ?? ''}
          onValueChange={(id) => {
            void setLeadCurrentOpener(leadId, id).then(() => onChanged());
          }}
          className="space-y-3"
        >
          {baselines.map((b) => {
            const conv =
              b.conversion_rate != null
                ? `${Math.round(Number(b.conversion_rate) * 100)}% conv.`
                : '—';
            return (
              <div key={b.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-start gap-2">
                  <RadioGroupItem value={b.id} id={`baseline-${b.id}`} className="mt-1" />
                  <Label htmlFor={`baseline-${b.id}`} className="cursor-pointer space-y-1">
                    <span className="block font-medium">{b.name ?? 'Baseline'}</span>
                    <span className="block text-muted-foreground">{b.opener_text}</span>
                    <span className="text-xs text-muted-foreground">
                      Used {b.times_used ?? 0} · Meetings {b.meetings_set ?? 0} · {conv}
                    </span>
                  </Label>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      )}
    </div>
  );
}
