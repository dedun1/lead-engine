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
import { useChartColors } from '@/lib/dashboard/chart-colors';
import { formatPct } from './format';

function cellStyle(
  rate: number,
  calls: number,
  colors: ReturnType<typeof useChartColors>,
): React.CSSProperties | undefined {
  if (calls === 0) return undefined;
  const alpha = rate >= 0.4 ? 0.85 : rate >= 0.25 ? 0.55 : rate >= 0.15 ? 0.45 : 0.35;
  const base =
    rate >= 0.4
      ? colors.chart3
      : rate >= 0.25
        ? colors.chart3
        : rate >= 0.15
          ? colors.chart5
          : colors.chart4;
  return { backgroundColor: base, opacity: alpha };
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
  const chartColors = useChartColors();

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
                const style = cellStyle(cell.connect_rate, cell.calls, chartColors);
                return (
                  <div
                    key={`${d}-${h}`}
                    className={`h-4 min-w-[12px] rounded-sm ${cell.calls === 0 ? 'bg-muted' : ''}`}
                    style={style}
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
