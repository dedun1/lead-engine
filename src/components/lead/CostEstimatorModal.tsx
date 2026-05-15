'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { CostEstimate } from '@/lib/cost/estimator';
import type { GeoSelection } from './GeoSelector';

type NicheOption = { id: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  niche: NicheOption;
  geo: GeoSelection;
  quantity: number;
  filters: Record<string, unknown>;
  onRun: (enrichmentSources: string[]) => void;
};

export function CostEstimatorModal({
  open,
  onOpenChange,
  niche,
  geo,
  quantity,
  filters: _filters,
  onRun,
}: Props) {
  const [cheapMode, setCheapMode] = useState(true);
  const [apollo, setApollo] = useState(false);
  const [hunter, setHunter] = useState(false);
  const [lusha, setLusha] = useState(false);
  const [noaa, setNoaa] = useState(false);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  const regionName = geo.region;

  const loadEstimate = useCallback(async () => {
    const sources = ['google_maps_scrape', 'claude_haiku_summary'];
    if (!cheapMode) {
      if (apollo) sources.push('apollo');
      if (hunter) sources.push('hunter');
      if (lusha) sources.push('lusha');
      if (noaa) sources.push('noaa');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/generate/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          niche_id: niche.id,
          enrichment_sources: sources,
        }),
      });
      if (res.ok) setEstimate(await res.json());
    } finally {
      setLoading(false);
    }
  }, [apollo, cheapMode, hunter, lusha, niche.id, noaa, quantity]);

  useEffect(() => {
    if (open) void loadEstimate();
  }, [open, loadEstimate]);

  const handleRun = () => {
    const sources = ['google_maps_scrape', 'claude_haiku_summary'];
    if (!cheapMode) {
      if (apollo) sources.push('apollo');
      if (hunter) sources.push('hunter');
      if (lusha) sources.push('lusha');
      if (noaa) sources.push('noaa');
    }
    onRun(sources);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Estimated cost for this run</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {quantity} leads × {niche.name} in {geo.city}, {regionName},{' '}
          {geo.country}
        </p>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="cheap-mode">Free sources only</Label>
          <Switch
            id="cheap-mode"
            checked={cheapMode}
            onCheckedChange={setCheapMode}
          />
        </div>
        {!cheapMode && (
          <div className="grid gap-2 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox checked={apollo} onCheckedChange={(v) => setApollo(!!v)} />
              Apollo enrichment
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={hunter} onCheckedChange={(v) => setHunter(!!v)} />
              Hunter email
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={lusha} onCheckedChange={(v) => setLusha(!!v)} />
              Lusha mobile
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={noaa} onCheckedChange={(v) => setNoaa(!!v)} />
              NOAA weather triggers
            </label>
          </div>
        )}
        {estimate && (
          <div className="overflow-x-auto text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1">Source</th>
                  <th>Count</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.line_items.map((row) => (
                  <tr key={row.source} className="border-b">
                    <td className="py-1">{row.source}</td>
                    <td>{row.count}</td>
                    <td>${row.unit_cost_usd.toFixed(3)}</td>
                    <td>${row.line_total_usd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 font-semibold">
              Total: ${estimate.total_usd.toFixed(2)}
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={loading}>
            Run Generation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
