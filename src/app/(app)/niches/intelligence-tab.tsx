'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/types/database.types';
import type { EditableIntelligenceField } from '@/lib/ai/types';
import { IntelligenceCardView } from './intelligence-card-view';
import {
  getNicheIntelligence,
  updateNicheIntelligenceField,
} from './intelligence-actions';

type Row = Database['public']['Tables']['niche_intelligence']['Row'];

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function sourceLabel(source: string | null): string {
  if (source === 'claude_web_search') return 'From web search';
  if (source === 'manual_edit') return 'Manual edits';
  return "From Claude's knowledge";
}

export function IntelligenceTab({
  nicheId,
  country,
  isAdmin,
}: {
  nicheId: string;
  country: string;
  isAdmin: boolean;
}) {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastCost, setLastCost] = useState<number | null>(null);

  const loadCached = useCallback(async () => {
    setLoading(true);
    const data = await getNicheIntelligence(nicheId, country);
    setRow(data);
    setLoading(false);
  }, [nicheId, country]);

  useEffect(() => {
    void loadCached();
  }, [loadCached]);

  async function generate(refresh = false) {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/niche-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche_id: nicheId, country, refresh }),
      });
      const data = (await res.json()) as {
        row?: Row;
        error?: string;
        raw_preview?: string;
        estimated_cost_usd?: number;
      };
      if (!res.ok) {
        toast.error(data.error ?? data.raw_preview ?? 'Generation failed');
        return;
      }
      if (data.row) setRow(data.row);
      if (data.estimated_cost_usd != null) setLastCost(data.estimated_cost_usd);
      toast.success(
        res.headers.get('x-cache-hit') === 'true'
          ? 'Loaded cached card'
          : 'Intelligence card generated',
      );
    } catch {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function patch(field: EditableIntelligenceField, value: unknown) {
    if (!row) return;
    const prev = row;
    setRow({ ...row, [field]: value } as Row);
    const result = await updateNicheIntelligenceField(
      nicheId,
      country,
      field,
      value,
    );
    if (!result.ok) {
      setRow(prev);
      toast.error(result.error);
    }
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      {!row ? (
        <p className="text-sm text-muted-foreground">
          No intelligence card for {country} yet. Generate one with Claude
          Haiku.
        </p>
      ) : (
        <IntelligenceCardView row={row} onPatch={patch} />
      )}

      <Button
        type="button"
        className="w-full"
        disabled={generating}
        onClick={() => generate(false)}
      >
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate intelligence card'
        )}
      </Button>

      {isAdmin && row && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={generating}
            >
              Regenerate from web search
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Overwrite intelligence card?</AlertDialogTitle>
              <AlertDialogDescription>
                This will overwrite the current card. Manual edits will be lost.
                Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => generate(true)}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {row && (
        <p className="text-xs text-muted-foreground">
          Source: {sourceLabel(row.generation_source)}
          {row.generated_at &&
            ` · ${formatDistanceToNow(new Date(row.generated_at), { addSuffix: true })}`}
          {lastCost != null && ` · Est. cost $${lastCost.toFixed(4)}`}
        </p>
      )}
    </div>
  );
}
