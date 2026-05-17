import { redirect } from 'next/navigation';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchLatestHealthBySource } from '@/lib/health/fetch-sources';
import { getSessionContext } from '@/lib/permissions';
import { HealthAggregateStats } from './aggregate-stats';
import { HealthRow } from './health-row';
import { HealthRunAllButton } from './health-actions';

export default async function HealthPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const rows = await fetchLatestHealthBySource();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Source Health</h1>
          <p className="text-sm text-muted-foreground">
            Scraper and detector status from live operations.
          </p>
        </div>
        <HealthRunAllButton isAdmin={ctx.isAdmin} />
      </div>

      <HealthAggregateStats rows={rows} />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No health records yet. Sources appear after scrapers or detectors run.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last check</TableHead>
              <TableHead>Failures</TableHead>
              <TableHead>Last error</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <HealthRow key={row.id} row={row} isAdmin={ctx.isAdmin} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
