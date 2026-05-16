import { Suspense } from 'react';
import { DateRangeSelector } from './date-range-selector';
import { DashboardAtAGlance } from './at-a-glance';
import { ClaudeInsightCard } from './claude-insight-card';
import { DashboardOpenerPerformance } from './opener-performance';
import {
  DashboardNichePerformance,
  buildBestHourLabel,
} from './niche-performance';
import { DashboardCallHeatmap } from './call-heatmap';
import { DashboardSentimentTags } from './sentiment-tags';
import { parseDateRange, priorPeriod, weekStartingMondayCairo } from '@/lib/dashboard/date-range';
import { fetchCallsInRange } from '@/lib/dashboard/fetch-calls';
import {
  getAtAGlanceMetrics,
  getOpenerPerformance,
  getNichePerformance,
  getCallTimingHeatmap,
  getTagAnalysis,
  getSentimentCorrelation,
  topTagInsights,
} from '@/lib/dashboard/aggregations';
import { getAuthUser, isAdmin } from '@/lib/permissions';
import { hasAnthropicKey } from '@/lib/ai/anthropic';
import { createClient } from '@/lib/supabase/server';
import type { DateRangePeriod } from '@/lib/dashboard/types';
import { Skeleton } from '@/components/ui/skeleton';
import type { OpenerCallDetail } from './opener-detail-drawer';

export const revalidate = 60;

type SearchParams = {
  period?: string;
  from?: string;
  to?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const period = (searchParams.period ?? 'this_week') as DateRangePeriod;
  const range = parseDateRange(period, searchParams.from, searchParams.to);
  const prior = priorPeriod(range);

  const user = await getAuthUser();
  const weekStart = weekStartingMondayCairo();
  const supabase = createClient();

  const [
    atAGlance,
    openers,
    niches,
    calls,
    nicheList,
    weeklyRow,
    anthropicOk,
    admin,
  ] = await Promise.all([
    getAtAGlanceMetrics(range.start, range.end, prior.start, prior.end),
    getOpenerPerformance(range.start, range.end),
    getNichePerformance(range.start, range.end),
    fetchCallsInRange(range.start, range.end),
    supabase.from('niches').select('id, name').order('name'),
    supabase
      .from('weekly_insights')
      .select('*')
      .eq('week_starting', weekStart)
      .maybeSingle(),
    hasAnthropicKey(),
    user ? isAdmin(user.id) : Promise.resolve(false),
  ]);

  const heatmap = getCallTimingHeatmap(calls);
  const tags = getTagAnalysis(calls);
  const sentiment = getSentimentCorrelation(calls);
  const tagInsights = topTagInsights(tags);

  const callsByVariant: Record<string, OpenerCallDetail[]> = {};
  const { data: openerCalls } = await supabase
    .from('call_attempts')
    .select('id, opener_variant_id, called_at, outcome, sub_outcome, sentiment_score')
    .gte('called_at', range.start)
    .lte('called_at', range.end)
    .not('opener_variant_id', 'is', null);

  for (const c of openerCalls ?? []) {
    const vid = c.opener_variant_id!;
    if (!callsByVariant[vid]) callsByVariant[vid] = [];
    callsByVariant[vid].push(c);
  }

  const openersByNiche: Record<string, typeof openers> = {};
  for (const o of openers) {
    if (!o.niche_id) continue;
    if (!openersByNiche[o.niche_id]) openersByNiche[o.niche_id] = [];
    openersByNiche[o.niche_id].push(o);
  }

  const dismissed =
    user &&
    weeklyRow.data?.dismissed_by?.includes(user.id);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learning Dashboard</h1>
          <p className="text-muted-foreground">{range.label}</p>
        </div>
        <Suspense fallback={<Skeleton className="h-10 w-44" />}>
          <DateRangeSelector period={period} />
        </Suspense>
      </header>

      <ClaudeInsightCard
        initialInsight={weeklyRow.data}
        dismissed={Boolean(dismissed)}
        hasKey={anthropicOk}
        isAdmin={admin}
      />

      <DashboardAtAGlance metrics={atAGlance} />

      <DashboardOpenerPerformance
        rows={openers}
        niches={nicheList.data ?? []}
        callsByVariant={callsByVariant}
      />

      <DashboardNichePerformance
        rows={niches}
        openersByNiche={openersByNiche}
        bestHoursByNiche={Object.fromEntries(
          niches.map((n) => {
            const nicheCalls = calls.filter((c) => c.niche_id === n.niche_id);
            const slot = getCallTimingHeatmap(nicheCalls).bestSlot;
            const label = buildBestHourLabel(slot);
            return [
              n.niche_id,
              label
                ? { label, connect: slot?.connect_rate ?? 0 }
                : null,
            ];
          }),
        )}
      />

      <DashboardCallHeatmap cells={heatmap.cells} bestSlot={heatmap.bestSlot} />

      <DashboardSentimentTags
        tags={tags}
        sentiment={sentiment}
        tagInsights={tagInsights}
      />
    </div>
  );
}
