import { createClient } from '@/lib/supabase/server';
import { DateTime } from 'luxon';
import type { AtAGlanceMetrics } from '../types';
async function countCalls(
  start: string,
  end: string,
  extra?: { outcome?: string; subOutcomes?: string[]; subOutcome?: string },
): Promise<number> {
  const supabase = createClient();
  let q = supabase
    .from('call_attempts')
    .select('id', { count: 'exact', head: true })
    .gte('called_at', start)
    .lte('called_at', end);
  if (extra?.outcome) q = q.eq('outcome', extra.outcome);
  if (extra?.subOutcomes) q = q.in('sub_outcome', extra.subOutcomes);
  if (extra?.subOutcome) q = q.eq('sub_outcome', extra.subOutcome);
  const { count } = await q;
  return count ?? 0;
}

async function periodRates(start: string, end: string) {
  const total = await countCalls(start, end);
  const answered = await countCalls(start, end, { outcome: 'answered' });
  const interested = await countCalls(start, end, {
    outcome: 'answered',
    subOutcomes: ['interested', 'follow_up_requested', 'booked_meeting'],
  });
  const meetings = await countCalls(start, end, { subOutcome: 'booked_meeting' });
  return {
    calls: total,
    connect_rate: total > 0 ? answered / total : 0,
    interested_rate: answered > 0 ? interested / answered : 0,
    meetings,
  };
}

function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return current > 0 ? 100 : null;
  return ((current - prior) / prior) * 100;
}

async function sparklineDays(endIso: string): Promise<string[]> {
  const end = DateTime.fromISO(endIso);
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = end.minus({ days: i });
    days.push(d.startOf('day').toUTC().toISO()!);
  }
  return days;
}

async function dailySparkline(
  metric: 'calls' | 'connect' | 'interested' | 'meetings',
  dayStarts: string[],
): Promise<number[]> {
  const out: number[] = [];
  for (let i = 0; i < dayStarts.length; i++) {
    const start = dayStarts[i]!;
    const end = DateTime.fromISO(start).plus({ days: 1 }).toISO()!;
    const rates = await periodRates(start, end);
    if (metric === 'calls') out.push(rates.calls);
    else if (metric === 'meetings') out.push(rates.meetings);
    else if (metric === 'connect')
      out.push(Math.round(rates.connect_rate * 100));
    else out.push(Math.round(rates.interested_rate * 100));
  }
  return out;
}

export async function getAtAGlanceMetrics(
  start: string,
  end: string,
  priorStart: string,
  priorEnd: string,
): Promise<AtAGlanceMetrics> {
  const current = await periodRates(start, end);
  const prior = await periodRates(priorStart, priorEnd);
  const dayStarts = await sparklineDays(end);

  return {
    ...current,
    deltas: {
      calls: pctDelta(current.calls, prior.calls),
      connect_rate: pctDelta(current.connect_rate, prior.connect_rate),
      interested_rate: pctDelta(current.interested_rate, prior.interested_rate),
      meetings: pctDelta(current.meetings, prior.meetings),
    },
    sparklines: {
      calls: await dailySparkline('calls', dayStarts),
      connect_rate: await dailySparkline('connect', dayStarts),
      interested_rate: await dailySparkline('interested', dayStarts),
      meetings: await dailySparkline('meetings', dayStarts),
    },
  };
}
