'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type Props = {
  leadId: string;
  enrichedAt: string | null;
  onDone: () => void;
};

const STEPS = [
  'Searching website…',
  'DuckDuckGo…',
  'Registry lookup…',
  'Verifying email…',
];

export function EnrichButton({ leadId, enrichedAt, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const fresh =
    enrichedAt &&
    Date.now() - new Date(enrichedAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  const run = async (force: boolean) => {
    setLoading(true);
    let step = 0;
    const toastId = toast.loading(STEPS[0]);
    const interval = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1);
      toast.loading(STEPS[step], { id: toastId });
    }, 4000);

    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, force_refresh: force }),
      });
      const data = (await res.json()) as { error?: string; cached?: boolean };
      clearInterval(interval);
      if (!res.ok) {
        toast.error(data.error ?? 'Enrichment failed', { id: toastId });
        return;
      }
      if (data.cached) {
        toast.message('Using enrichment from the last 7 days', { id: toastId });
      } else {
        toast.success('Enrichment complete', { id: toastId });
      }
      onDone();
    } catch {
      clearInterval(interval);
      toast.error('Enrichment failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!fresh) {
    return (
      <Button type="button" size="lg" disabled={loading} onClick={() => void run(false)}>
        {loading ? 'Enriching…' : 'Find owner info'}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={() => void run(true)}
    >
      {loading
        ? 'Re-enriching…'
        : `Re-enrich (last ${formatDistanceToNow(new Date(enrichedAt!))} ago)`}
    </Button>
  );
}
