'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { OpenerPerformanceRow } from '@/lib/dashboard/types';

export type OpenerCallDetail = {
  id: string;
  called_at: string | null;
  outcome: string | null;
  sub_outcome: string | null;
  sentiment_score: number | null;
};

export function OpenerDetailDrawer({
  row,
  calls,
  open,
  onOpenChange,
}: {
  row: OpenerPerformanceRow | null;
  calls: OpenerCallDetail[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return null;

  const sentimentCounts = new Map<number, number>();
  for (const c of calls) {
    if (c.sentiment_score == null) continue;
    const s = Math.round(c.sentiment_score);
    sentimentCounts.set(s, (sentimentCounts.get(s) ?? 0) + 1);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Opener variant</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 text-sm">
          <p className="whitespace-pre-wrap">{row.opener_text}</p>
          <div className="flex flex-wrap gap-2">
            {row.hook_type && <Badge variant="secondary">{row.hook_type}</Badge>}
            {row.is_personalized && <Badge>Personalized</Badge>}
          </div>
          <div>
            <p className="font-medium mb-1">Sentiment distribution</p>
            {[...sentimentCounts.entries()].map(([score, n]) => (
              <p key={score} className="text-muted-foreground">
                Score {score}: {n} calls
              </p>
            ))}
          </div>
          <div>
            <p className="font-medium mb-2">Calls with this variant</p>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {calls.map((c) => (
                <li key={c.id} className="rounded border p-2">
                  <p>{c.called_at?.slice(0, 16) ?? '—'}</p>
                  <p>
                    {c.outcome}
                    {c.sub_outcome ? ` / ${c.sub_outcome}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
