'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { OpenerVariantRow } from '@/lib/ai/opener-types';
import { fetchLeadOpenerBundle } from '@/lib/opener/actions';
import { OpenerBaselineSection } from './opener-baseline-section';
import { OpenerCard } from './opener-card';
import { OpenerRegenerateDialog } from './opener-regenerate-dialog';

type Props = {
  leadId: string;
  isAdmin: boolean;
  hasIntelligence: boolean;
  nicheId: string | null;
  compact?: boolean;
  refreshKey?: number;
};

function activeVariant(
  personalized: OpenerVariantRow | null,
  baselines: OpenerVariantRow[],
  currentId: string | null,
): OpenerVariantRow | null {
  if (currentId) {
    if (personalized?.id === currentId) return personalized;
    const base = baselines.find((b) => b.id === currentId);
    if (base) return base;
  }
  return personalized ?? baselines[0] ?? null;
}

export function LeadOpenerPanel({
  leadId,
  isAdmin,
  hasIntelligence,
  nicheId,
  compact,
  refreshKey,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [personalized, setPersonalized] = useState<OpenerVariantRow | null>(null);
  const [baselines, setBaselines] = useState<OpenerVariantRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const bundle = await fetchLeadOpenerBundle(leadId);
    if (bundle) {
      setPersonalized(bundle.personalized);
      setBaselines(bundle.baselines);
      setCurrentId(bundle.currentVariantId);
    }
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const generate = async (refresh = false) => {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/opener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, refresh }),
      });
      const data = (await res.json()) as { error?: string; row?: OpenerVariantRow };
      if (!res.ok) {
        toast.error(data.error ?? 'Generation failed');
        return;
      }
      toast.success(refresh ? 'Opener regenerated' : 'Opener generated');
      void load();
    } finally {
      setGenerating(false);
      setConfirmRegen(false);
    }
  };

  if (!hasIntelligence) {
    return (
      <p className="text-sm text-muted-foreground">
        Generate niche intelligence first.{' '}
        <Link href="/niches" className="text-primary underline">
          Niche Explorer
        </Link>
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading opener…</p>;
  }

  const display = activeVariant(personalized, baselines, currentId);

  return (
    <section className="space-y-3">
      <h3 className="font-semibold">
        {compact ? 'Your opener' : 'Personalized opener for this lead'}
      </h3>

      {display ? (
        <OpenerCard
          variant={display}
          isAdmin={isAdmin}
          compact={compact}
          onRegenerate={() => setConfirmRegen(true)}
          onUpdated={() => void load()}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            No personalized opener yet.
          </p>
          <Button
            type="button"
            disabled={generating}
            onClick={() => void generate(false)}
          >
            {generating ? 'Generating…' : 'Generate opener'}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Or pick from niche baselines</p>
      <OpenerBaselineSection
        leadId={leadId}
        baselines={baselines}
        currentVariantId={currentId}
        onChanged={() => void load()}
      />

      {!personalized && baselines.length === 0 && nicheId && (
        <p className="text-xs text-muted-foreground">
          No baselines yet. Admin: mark niche actively pitching or generate at{' '}
          <Link href="/niches" className="underline">
            /niches
          </Link>
          .
        </p>
      )}

      <OpenerRegenerateDialog
        open={confirmRegen}
        onOpenChange={setConfirmRegen}
        loading={generating}
        onConfirm={() => void generate(true)}
      />
    </section>
  );
}
