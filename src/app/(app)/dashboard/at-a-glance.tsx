import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AtAGlanceMetrics } from '@/lib/dashboard/types';
import { formatDelta, formatPct } from './format';

function StatCard({
  title,
  value,
  delta,
  sparkline,
  suffix,
}: {
  title: string;
  value: string;
  delta: number | null;
  sparkline: number[];
  suffix?: string;
}) {
  const max = Math.max(...sparkline, 1);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-bold tabular-nums">
          {value}
          {suffix}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">{formatDelta(delta)}</p>
        <div className="flex h-6 items-end gap-0.5">
          {sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/40"
              style={{ height: `${Math.max(4, (v / max) * 24)}px` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardAtAGlance({ metrics }: { metrics: AtAGlanceMetrics }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">This week</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Calls made"
          value={String(metrics.calls)}
          delta={metrics.deltas.calls}
          sparkline={metrics.sparklines.calls}
        />
        <StatCard
          title="Connect rate"
          value={formatPct(metrics.connect_rate)}
          delta={metrics.deltas.connect_rate}
          sparkline={metrics.sparklines.connect_rate}
        />
        <StatCard
          title="Interested rate"
          value={formatPct(metrics.interested_rate)}
          delta={metrics.deltas.interested_rate}
          sparkline={metrics.sparklines.interested_rate}
        />
        <StatCard
          title="Meetings booked"
          value={String(metrics.meetings)}
          delta={metrics.deltas.meetings}
          sparkline={metrics.sparklines.meetings}
        />
      </div>
    </section>
  );
}
