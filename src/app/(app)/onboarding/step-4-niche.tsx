'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { selectOnboardingNiche } from '@/lib/onboarding/actions';
import type { NicheRecord } from '@/lib/niches/types';

export function StepNiche({
  niches,
  onContinue,
}: {
  niches: NicheRecord[];
  onContinue: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const res = await selectOnboardingNiche(selected);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onContinue();
  }

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-muted-foreground">
        Pick a niche to start pitching. Baseline openers generate in the background.
      </p>
      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
        {niches.slice(0, 12).map((n) => (
          <button
            key={n.id}
            type="button"
            className={`rounded-lg border p-3 text-left text-sm transition-colors ${
              selected === n.id
                ? 'border-primary bg-primary/10'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelected(n.id)}
          >
            <p className="font-medium line-clamp-2">{n.name}</p>
            <p className="text-xs text-muted-foreground">{n.naics_code ?? '—'}</p>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        className="w-full"
        disabled={!selected || busy}
        onClick={() => void confirm()}
      >
        Continue
      </Button>
    </div>
  );
}
