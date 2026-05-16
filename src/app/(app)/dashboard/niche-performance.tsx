'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type {
  HeatmapCell,
  NichePerformanceRow,
  OpenerPerformanceRow,
} from '@/lib/dashboard/types';
import { formatPct } from './format';
import { dayLabels } from '@/lib/dashboard/date-range';

const STATUS_ICON = { worth: '🟢', inconclusive: '🟡', skip: '🔴' } as const;

export function DashboardNichePerformance({
  rows,
  openersByNiche,
  bestHoursByNiche,
}: {
  rows: NichePerformanceRow[];
  openersByNiche: Record<string, OpenerPerformanceRow[]>;
  bestHoursByNiche: Record<string, { label: string; connect: number } | null | undefined>;
}) {
  const [selected, setSelected] = useState<NichePerformanceRow | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Niches — which ones are profitable</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Niche</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Connect</TableHead>
                <TableHead>Interested</TableHead>
                <TableHead>Meetings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.niche_id}
                  className="cursor-pointer"
                  onClick={() => setSelected(row)}
                >
                  <TableCell>
                    <p className="font-medium">{row.niche_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.naics_code ?? '—'}
                    </p>
                  </TableCell>
                  <TableCell>{row.total_leads}</TableCell>
                  <TableCell>{row.calls}</TableCell>
                  <TableCell>{formatPct(row.connect_rate)}</TableCell>
                  <TableCell>{formatPct(row.interested_rate)}</TableCell>
                  <TableCell>{row.meetings}</TableCell>
                  <TableCell>
                    {STATUS_ICON[row.status]} {row.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selected?.niche_name}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4 text-sm">
              <p>
                Top openers:{' '}
                {(openersByNiche[selected.niche_id] ?? [])
                  .slice(0, 3)
                  .map((o) => o.opener_text.slice(0, 40))
                  .join(' · ') || '—'}
              </p>
              <p>
                Best time to call:{' '}
                {bestHoursByNiche[selected.niche_id]?.label ?? 'Need more data'}
              </p>
              {selected.calls < 5 && (
                <p className="text-amber-600">Need more data (n&lt;5)</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export function buildBestHourLabel(cell: HeatmapCell | null): string | null {
  if (!cell || cell.calls < 5) return null;
  const days = dayLabels();
  return `${days[cell.day]} ${cell.hour}:00–${cell.hour + 1}:00 local (${Math.round(cell.connect_rate * 100)}% connect)`;
}
