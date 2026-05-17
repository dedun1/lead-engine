'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ExportKind } from '@/lib/admin/export-stream';

type Niche = { id: string; name: string };

export function ExportCard({
  title,
  description,
  kind,
  niches,
  defaultNicheIds,
}: {
  title: string;
  description: string;
  kind: ExportKind;
  niches: Niche[];
  defaultNicheIds?: string[];
}) {
  const [start, setStart] = useState(defaultRangeStart());
  const [end, setEnd] = useState(defaultRangeEnd());
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [selectedNiches, setSelectedNiches] = useState<Set<string>>(
    new Set(defaultNicheIds ?? []),
  );
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          niche_ids: selectedNiches.size ? [...selectedNiches] : undefined,
          format,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ??
        `leadengine-${kind}.${format === 'csv' ? 'csv' : 'jsonl'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>From</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {niches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {niches.map((n) => {
              const on = selectedNiches.has(n.id);
              return (
                <Button
                  key={n.id}
                  type="button"
                  size="sm"
                  variant={on ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedNiches((prev) => {
                      const next = new Set(prev);
                      if (next.has(n.id)) next.delete(n.id);
                      else next.add(n.id);
                      return next;
                    });
                  }}
                >
                  {n.name}
                </Button>
              );
            })}
          </div>
        )}
        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as 'csv' | 'json')}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="csv" id={`${kind}-csv`} />
            <Label htmlFor={`${kind}-csv`}>CSV</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="json" id={`${kind}-json`} />
            <Label htmlFor={`${kind}-json`}>JSON (NDJSON)</Label>
          </div>
        </RadioGroup>
        <Button onClick={() => void download()} disabled={loading}>
          {loading ? 'Preparing…' : 'Download'}
        </Button>
      </CardContent>
    </Card>
  );
}

function defaultRangeStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultRangeEnd(): string {
  return new Date().toISOString().slice(0, 10);
}
