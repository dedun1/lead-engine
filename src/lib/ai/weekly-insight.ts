import { DateTime } from 'luxon';
import { callHaiku } from '@/lib/ai/anthropic';
import { safeParseJson } from '@/lib/ai/parse-json';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAtAGlanceMetrics } from '@/lib/dashboard/aggregations/at-a-glance';
import { getOpenerPerformance } from '@/lib/dashboard/aggregations/openers';
import { getNichePerformance } from '@/lib/dashboard/aggregations/niches';
import { fetchCallsInRange } from '@/lib/dashboard/fetch-calls';
import {
  getCallTimingHeatmap,
} from '@/lib/dashboard/aggregations/heatmap';
import {
  getTagAnalysis,
  topTagInsights,
} from '@/lib/dashboard/aggregations/tags-sentiment';
import { priorPeriod } from '@/lib/dashboard/date-range';
import type { WeeklyInsightPayload } from '@/lib/dashboard/types';

const CAIRO = 'Africa/Cairo';
const MIN_CALLS = 10;

export const WEEKLY_INSIGHT_PROMPT_SYSTEM = `You are a cold-call performance analyst. Given last week's metrics, identify 3-5 actionable insights and 2-3 experiments to run next week.
Respond with JSON only, no markdown. Schema:
{
  "headline_observation": "1-2 sentences",
  "actionable_insights": [{"insight":"","evidence":"","recommendation":""}],
  "experiments_to_try": [{"hypothesis":"","how_to_test":"","minimum_calls_needed":number}]
}`;

function topObjectionsFromNotes(notes: string[]): string[] {
  const keywords = [
    'price',
    'budget',
    'busy',
    'not interested',
    'call back',
    'owner',
    'competitor',
    'timing',
    'email',
  ];
  const counts = new Map<string, number>();
  for (const note of notes) {
    const lower = note.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        counts.set(kw, (counts.get(kw) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, n]) => `${k}: ${n}`);
}

function isValidInsight(data: unknown): data is WeeklyInsightPayload {
  if (!data || typeof data !== 'object') return false;
  const d = data as WeeklyInsightPayload;
  return (
    typeof d.headline_observation === 'string' &&
    Array.isArray(d.actionable_insights) &&
    Array.isArray(d.experiments_to_try)
  );
}

export async function generateWeeklyInsight(
  generatedBy: string = 'system',
): Promise<WeeklyInsightPayload & { week_starting: string; source_metrics: Record<string, unknown> }> {
  const now = DateTime.now().setZone(CAIRO);
  const weekStart = now.startOf('week').toISODate()!;
  const lastWeekStart = now.minus({ weeks: 1 }).startOf('week');
  const lastWeekEnd = now.minus({ weeks: 1 }).endOf('week');
  const start = lastWeekStart.toUTC().toISO()!;
  const end = lastWeekEnd.toUTC().toISO()!;
  const prior = priorPeriod({ period: 'last_week', start, end, label: 'Last week' });

  const calls = await fetchCallsInRange(start, end);
  if (calls.length < MIN_CALLS) {
    throw new Error(`Need at least ${MIN_CALLS} calls last week to generate insights`);
  }

  const [atAGlance, openers, niches] = await Promise.all([
    getAtAGlanceMetrics(start, end, prior.start, prior.end),
    getOpenerPerformance(start, end, { minUses: 1 }),
    getNichePerformance(start, end),
  ]);

  const { cells, bestSlot } = getCallTimingHeatmap(calls);
  const tags = getTagAnalysis(calls);
  const tagLines = topTagInsights(tags);

  const { data: noteRows } = await createAdminClient()
    .from('call_attempts')
    .select('notes')
    .gte('called_at', start)
    .lte('called_at', end)
    .not('notes', 'is', null);

  const objections = topObjectionsFromNotes(
    (noteRows ?? []).map((r) => r.notes ?? '').filter(Boolean),
  );

  const source_metrics = {
    call_count: calls.length,
    at_a_glance: atAGlance,
    top_openers: openers.slice(0, 5),
    bottom_openers: [...openers].reverse().slice(0, 3),
    niches: niches.filter((n) => n.calls >= 5).slice(0, 8),
    objections,
    tag_insights: tagLines,
    best_slot: bestSlot,
    worst_slots: [...cells]
      .filter((c) => c.calls >= 5)
      .sort((a, b) => a.connect_rate - b.connect_rate)
      .slice(0, 3),
  };

  const userPrompt = JSON.stringify(source_metrics, null, 2);

  const { text } = await callHaiku({
    systemPrompt: WEEKLY_INSIGHT_PROMPT_SYSTEM,
    userPrompt,
    maxTokens: 2048,
    temperature: 0.5,
  });

  const parsed = safeParseJson<WeeklyInsightPayload>(text);
  if (!parsed || !isValidInsight(parsed)) {
    throw new Error('Failed to parse weekly insight JSON from Haiku');
  }

  const admin = createAdminClient();
  const row = {
    week_starting: weekStart,
    headline_observation: parsed.headline_observation,
    actionable_insights: parsed.actionable_insights,
    experiments_to_try: parsed.experiments_to_try,
    insight_text: parsed.headline_observation,
    generated_at: new Date().toISOString(),
    generated_by: generatedBy,
    source_metrics,
  };

  const { data: existing } = await admin
    .from('weekly_insights')
    .select('id')
    .eq('week_starting', weekStart)
    .maybeSingle();

  if (existing?.id) {
    await admin.from('weekly_insights').update(row).eq('id', existing.id);
  } else {
    await admin.from('weekly_insights').insert(row);
  }

  return { ...parsed, week_starting: weekStart, source_metrics };
}
