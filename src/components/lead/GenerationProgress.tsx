'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { GenerateSseEvent } from '@/lib/generate/sse';
import type { GenerationFilters } from '@/lib/generate/filters';

type Props = {
  payload: {
    niche_id: string;
    country: string;
    region: string;
    city: string;
    postalCode?: string;
    quantity: number;
    filters: GenerationFilters;
    enrichment_sources: string[];
  };
  geoLabel: string;
  onDone?: () => void;
};

export function GenerationProgress({ payload, geoLabel, onDone }: Props) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [inserted, setInserted] = useState(0);
  const [duplicates, setDuplicates] = useState(0);
  const [blocked, setBlocked] = useState(0);
  const [filtered, setFiltered] = useState(0);
  const [cost, setCost] = useState(0);
  const [feed, setFeed] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    abortRef.current = ac;

    const pushFeed = (line: string) => {
      setFeed((prev) => [line, ...prev].slice(0, 5));
    };

    const handleEvent = (event: GenerateSseEvent) => {
      if (event.type === 'started') setJobId(event.job_id);
      if (event.type === 'lead_inserted') {
        setInserted((n) => n + 1);
        pushFeed(`Inserted ${event.business_name}`);
      }
      if (event.type === 'lead_skipped_duplicate') {
        setDuplicates((n) => n + 1);
        pushFeed(`Duplicate ${event.business_name}`);
      }
      if (event.type === 'lead_skipped_blocklist') {
        setBlocked((n) => n + 1);
        pushFeed(`Blocked ${event.business_name}`);
      }
      if (event.type === 'lead_skipped_filter') {
        setFiltered((n) => n + 1);
        pushFeed(`Filtered ${event.business_name}`);
      }
      if (event.type === 'completed') {
        setCost(event.actual_cost_usd);
        setDone(true);
        onDone?.();
      }
      if (event.type === 'error') setError(event.message);
    };

    (async () => {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        setError('Failed to start generation');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const chunk of parts) {
          const line = chunk.replace(/^data:\s*/, '').trim();
          if (!line) continue;
          try {
            handleEvent(JSON.parse(line) as GenerateSseEvent);
          } catch {
            // skip bad chunk
          }
        }
      }
    })().catch(() => {
      if (!ac.signal.aborted) setError('Stream interrupted');
    });

    return () => ac.abort();
  }, [payload, onDone]);

  const progressPct = Math.min(
    100,
    Math.round((inserted / payload.quantity) * 100),
  );

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Generating — {geoLabel}</h2>
      <Progress value={progressPct} />
      <p className="text-sm text-muted-foreground">
        {inserted} / {payload.quantity} · ${cost.toFixed(2)}
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <span>✅ {inserted}</span>
        <span>🔁 {duplicates}</span>
        <span>🚫 {blocked}</span>
        <span>🎚️ {filtered}</span>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {feed.map((line, i) => (
          <li key={`${line}-${i}`}>{line}</li>
        ))}
      </ul>
      {!done && !error && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (jobId) void fetch(`/api/generate/${jobId}/pause`, { method: 'POST' });
            }}
          >
            Pause
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              abortRef.current?.abort();
              if (jobId) void fetch(`/api/generate/${jobId}/cancel`, { method: 'POST' });
            }}
          >
            Cancel
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {done && (
        <div className="space-y-2 rounded-md border p-4">
          <p className="font-medium">Run complete</p>
          <Button asChild>
            <Link href="/pipeline">
              View {inserted} new leads in Pipeline
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
