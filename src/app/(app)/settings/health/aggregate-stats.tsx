import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScraperHealthRow } from '@/lib/health/fetch-sources';
import { aggregateHealthCounts } from '@/lib/settings/health-status';

export function HealthAggregateStats({ rows }: { rows: ScraperHealthRow[] }) {
  const c = aggregateHealthCounts(rows);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Healthy</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-emerald-700">{c.healthy}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Degraded</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-amber-700">{c.degraded}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Down</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-red-700">{c.down}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Disabled</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold text-slate-600">{c.disabled}</CardContent>
      </Card>
    </div>
  );
}
