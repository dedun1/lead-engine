'use client';

import { Fragment, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { HeatmapCell } from '@/lib/dashboard/types';
import { dayLabels } from '@/lib/dashboard/date-range';
import { formatPct } from './format';

function cellColor(rate: number, calls: number): string {
  if (calls === 0) return 'bg-muted';
  if (rate >= 0.4) return 'bg-emerald-500/80';
  if (rate >= 0.25) return 'bg-emerald-400/50';
  if (rate >= 0.15) return 'bg-amber-400/50';
  return 'bg-red-400/40';
}

export function DashboardCallHeatmap({
  cells,
  bestSlot,
}: {
  cells: HeatmapCell[];
  bestSlot: HeatmapCell | null;
}) {
  const [hover, setHover] = useState<HeatmapCell | null>(null);
  const days = dayLabels();

  const bestLabel =
    bestSlot && bestSlot.calls >= 20
      ? `${days[bestSlot.day]} ${bestSlot.hour}:00 (${formatPct(bestSlot.connect_rate)})`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>When to call</CardTitle>
        {bestLabel && (
          <CardDescription>Best time to call: {bestLabel}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid grid-cols-[48px_repeat(24,minmax(12px,1fr))] gap-px text-[10px]">
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center text-muted-foreground">
              {h}
            </div>
          ))}
          {days.map((day, d) => (
            <Fragment key={d}>
              <div className="pr-1 text-right text-muted-foreground">{day}</div>
              {Array.from({ length: 24 }, (_, h) => {
                const cell =
                  cells.find((c) => c.day === d && c.hour === h) ?? {
                    day: d,
                    hour: h,
                    calls: 0,
                    connect_rate: 0,
                    interested_rate: 0,
                  };
                return (
                  <div
                    key={`${d}-${h}`}
                    className={`h-4 min-w-[12px] rounded-sm ${cellColor(cell.connect_rate, cell.calls)}`}
                    onMouseEnter={() => setHover(cell)}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
        {hover && hover.calls > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {days[hover.day]} {hover.hour}:00–{hover.hour + 1}:00 local:{' '}
            {hover.calls} calls, {formatPct(hover.connect_rate)} connect,{' '}
            {formatPct(hover.interested_rate)} interested
          </p>
        )}
      </CardContent>
    </Card>
  );
}
