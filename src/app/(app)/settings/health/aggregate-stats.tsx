import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScraperHealthRow } from '@/lib/health/fetch-sources';
import { aggregateHealthCounts } from '@/lib/settings/health-status';

const STAT_CLASS = {
  healthy: 'text-chart-3',
  degraded: 'text-warning',
  down: 'text-destructive',
  disabled: 'text-muted-foreground',
} as const;

export function HealthAggregateStats({ rows }: { rows: ScraperHealthRow[] }) {
  const c = aggregateHealthCounts(rows);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Healthy</CardTitle>
        </CardHeader>
        <CardContent className={`text-2xl font-bold ${STAT_CLASS.healthy}`}>
          {c.healthy}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Degraded</CardTitle>
        </CardHeader>
        <CardContent className={`text-2xl font-bold ${STAT_CLASS.degraded}`}>
          {c.degraded}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Down</CardTitle>
        </CardHeader>
        <CardContent className={`text-2xl font-bold ${STAT_CLASS.down}`}>
          {c.down}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Disabled</CardTitle>
        </CardHeader>
        <CardContent className={`text-2xl font-bold ${STAT_CLASS.disabled}`}>
          {c.disabled}
        </CardContent>
      </Card>
    </div>
  );
}
