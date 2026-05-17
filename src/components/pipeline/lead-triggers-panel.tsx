'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  payloadSummary,
  SEVERITY_CLASS,
  TRIGGER_LABELS,
} from '@/lib/triggers/display';
import type { TriggerType } from '@/lib/triggers/types';
import { dismissTrigger } from '@/app/(app)/hot-list/actions';

export type LeadTriggerRow = {
  id: string;
  trigger_type: TriggerType;
  severity: string | null;
  detected_at: string | null;
  expires_at: string | null;
  details: Record<string, unknown> | null;
};

export function LeadTriggersPanel({
  triggers,
  onUseInOpener,
}: {
  triggers: LeadTriggerRow[];
  onUseInOpener: (triggerId: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  if (!triggers.length) {
    return (
      <p className="text-sm text-muted-foreground">No active triggers for this lead.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {triggers.map((t) => (
        <li key={t.id} className="rounded-md border p-3 text-sm space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={SEVERITY_CLASS[t.severity ?? 'low'] ?? ''}>
              {t.severity}
            </Badge>
            <span className="font-medium">{TRIGGER_LABELS[t.trigger_type]}</span>
          </div>
          <p>{payloadSummary(t.trigger_type, t.details)}</p>
          <p className="text-xs text-muted-foreground">
            Detected {t.detected_at ? new Date(t.detected_at).toLocaleString() : '—'}
            {t.expires_at
              ? ` · Expires ${new Date(t.expires_at).toLocaleDateString()}`
              : ''}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => onUseInOpener(t.id)}
            >
              Use in opener
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await dismissTrigger(t.id);
                  toast.success('Trigger dismissed');
                })
              }
            >
              Dismiss
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
