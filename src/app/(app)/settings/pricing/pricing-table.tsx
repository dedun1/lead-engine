'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  resetPricingToDefaults,
  updatePricingConfig,
} from './actions';

export type PricingRow = {
  id: string;
  source: string;
  unit: string | null;
  cost_usd: number | null;
  notes: string | null;
};

export function PricingTable({
  rows,
  isAdmin,
}: {
  rows: PricingRow[];
  isAdmin: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function saveField(
    id: string,
    field: 'cost_usd' | 'notes',
    value: string,
  ) {
    if (!isAdmin) return;
    const result = await updatePricingConfig(id, field, value);
    if (!result.ok) toast.error(result.error);
  }

  async function handleReset() {
    setBusy(true);
    const result = await resetPricingToDefaults();
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Pricing reset to defaults');
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={handleReset}
          >
            Reset to defaults
          </Button>
        </div>
      )}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="w-32">Cost (USD)</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">
                  {row.source}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.unit}
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      defaultValue={row.cost_usd ?? 0}
                      className="h-8"
                      onBlur={(e) =>
                        saveField(row.id, 'cost_usd', e.target.value)
                      }
                    />
                  ) : (
                    <span>{row.cost_usd}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Input
                      defaultValue={row.notes ?? ''}
                      className="h-8"
                      onBlur={(e) =>
                        saveField(row.id, 'notes', e.target.value)
                      }
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {row.notes}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!isAdmin && (
        <p className="text-xs text-muted-foreground">
          Read-only — admins can edit costs and notes.
        </p>
      )}
    </div>
  );
}
