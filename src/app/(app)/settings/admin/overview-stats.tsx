import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OverviewStats } from '@/lib/admin/overview-stats';
import type { LeadStatus } from '@/lib/pipeline/types';

const BAR_STATUSES: LeadStatus[] = ['queued', 'contacted', 'customer', 'dead', 'dnc'];

export function OverviewStatsGrid({ stats }: { stats: OverviewStats }) {
  const barTotal = BAR_STATUSES.reduce((s, k) => s + (stats.leadsByStatus[k] ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total leads" value={String(stats.totalLeads)}>
          <div className="mt-3 space-y-1">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {BAR_STATUSES.map((st) => {
                const n = stats.leadsByStatus[st] ?? 0;
                const pct = barTotal ? (n / barTotal) * 100 : 0;
                if (!pct) return null;
                return (
                  <div
                    key={st}
                    className="h-full bg-primary/70"
                    style={{ width: `${pct}%` }}
                    title={`${st}: ${n}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              {BAR_STATUSES.map((st) => (
                <span key={st}>
                  {st}: {stats.leadsByStatus[st] ?? 0}
                </span>
              ))}
            </div>
          </div>
        </StatCard>
        <StatCard title="Calls all time" value={String(stats.callsAllTime)} />
        <StatCard title="Calls this week" value={String(stats.callsThisWeek)} />
        <StatCard title="Calls today (UTC)" value={String(stats.callsToday)} />
        <StatCard
          title="Active team members"
          value={String(stats.activeMembers)}
        />
        <StatCard
          title="Anthropic API spend (this month)"
          value={stats.apiSpendDisplay}
          muted={!stats.apiSpendIsTracked}
        />
        <StatCard
          title="Top caller this week"
          value={
            stats.topCaller
              ? `${stats.topCaller.name} (${stats.topCaller.count})`
              : '—'
          }
        />
        <StatCard
          title="Top niche — meetings this month"
          value={
            stats.topNicheMeetings
              ? `${stats.topNicheMeetings.name} (${stats.topNicheMeetings.count})`
              : '—'
          }
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            View usage in the{' '}
            <Link
              href="https://supabase.com/dashboard"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase dashboard
            </Link>
            .
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  children,
  muted,
}: {
  title: string;
  value: string;
  children?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            muted
              ? 'text-xs leading-snug text-muted-foreground'
              : 'text-2xl font-semibold tabular-nums'
          }
        >
          {value}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}
