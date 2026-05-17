import { createClient } from '@/lib/supabase/server';
import { isMeeting } from '@/lib/dashboard/call-metrics';
import type { LeadStatus } from '@/lib/pipeline/types';

const STATUS_BAR: LeadStatus[] = ['queued', 'contacted', 'customer', 'dead', 'dnc'];

export type OverviewStats = {
  leadsByStatus: Record<string, number>;
  totalLeads: number;
  callsAllTime: number;
  callsThisWeek: number;
  callsToday: number;
  activeMembers: number;
  apiSpendDisplay: string;
  apiSpendIsTracked: boolean;
  topCaller: { name: string; count: number } | null;
  topNicheMeetings: { name: string; count: number } | null;
};

function monthStartUtc(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function weekStartUtc(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff),
  );
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

function todayStartUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const supabase = createClient();
  const monthStart = monthStartUtc();
  const weekStart = weekStartUtc();
  const todayStart = todayStartUtc();

  const [
    leadsRes,
    callsAll,
    callsWeek,
    callsToday,
    membersRes,
    spendRes,
    weekCallsRes,
    monthMeetingCalls,
    nichesRes,
  ] = await Promise.all([
    supabase.from('leads').select('status'),
    supabase.from('call_attempts').select('id', { count: 'exact', head: true }),
    supabase
      .from('call_attempts')
      .select('id', { count: 'exact', head: true })
      .gte('called_at', weekStart),
    supabase
      .from('call_attempts')
      .select('id', { count: 'exact', head: true })
      .gte('called_at', todayStart),
    supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('generation_jobs')
      .select('estimated_cost_usd')
      .gte('created_at', monthStart)
      .not('estimated_cost_usd', 'is', null),
    supabase
      .from('call_attempts')
      .select('actor_id, team_members(display_name, email)')
      .gte('called_at', weekStart)
      .not('actor_id', 'is', null),
    supabase
      .from('call_attempts')
      .select('lead_id, sub_outcome')
      .gte('called_at', monthStart)
      .eq('sub_outcome', 'booked_meeting'),
    supabase.from('niches').select('id, name'),
  ]);

  const leadsByStatus: Record<string, number> = {};
  for (const s of STATUS_BAR) leadsByStatus[s] = 0;
  for (const row of leadsRes.data ?? []) {
    const st = row.status ?? 'new';
    leadsByStatus[st] = (leadsByStatus[st] ?? 0) + 1;
  }
  const totalLeads = (leadsRes.data ?? []).length;

  let spendSum = 0;
  for (const row of spendRes.data ?? []) {
    spendSum += Number(row.estimated_cost_usd ?? 0);
  }
  const apiSpendIsTracked = spendSum > 0;
  const apiSpendDisplay = apiSpendIsTracked
    ? `$${spendSum.toFixed(2)}`
    : 'Tracking not configured — check Anthropic console at console.anthropic.com';

  const callerCounts = new Map<string, { name: string; count: number }>();
  for (const c of weekCallsRes.data ?? []) {
    const id = c.actor_id!;
    const tm = c.team_members as { display_name: string | null; email: string } | null;
    const name = tm?.display_name ?? tm?.email ?? 'Unknown';
    const prev = callerCounts.get(id) ?? { name, count: 0 };
    prev.count += 1;
    callerCounts.set(id, prev);
  }
  let topCaller: OverviewStats['topCaller'] = null;
  for (const v of callerCounts.values()) {
    if (!topCaller || v.count > topCaller.count) topCaller = v;
  }

  const nicheMap = new Map((nichesRes.data ?? []).map((n) => [n.id, n.name]));
  const leadIds = [...new Set((monthMeetingCalls.data ?? []).map((c) => c.lead_id).filter(Boolean))];
  let topNicheMeetings: OverviewStats['topNicheMeetings'] = null;
  if (leadIds.length) {
    const { data: leadRows } = await supabase
      .from('leads')
      .select('id, niche_id')
      .in('id', leadIds as string[]);
    const nicheCounts = new Map<string, number>();
    for (const c of monthMeetingCalls.data ?? []) {
      if (!isMeeting(c.sub_outcome)) continue;
      const lead = leadRows?.find((l) => l.id === c.lead_id);
      if (!lead?.niche_id) continue;
      nicheCounts.set(lead.niche_id, (nicheCounts.get(lead.niche_id) ?? 0) + 1);
    }
    for (const [nicheId, count] of nicheCounts) {
      const name = nicheMap.get(nicheId) ?? 'Unknown';
      if (!topNicheMeetings || count > topNicheMeetings.count) {
        topNicheMeetings = { name, count };
      }
    }
  }

  return {
    leadsByStatus,
    totalLeads,
    callsAllTime: callsAll.count ?? 0,
    callsThisWeek: callsWeek.count ?? 0,
    callsToday: callsToday.count ?? 0,
    activeMembers: membersRes.count ?? 0,
    apiSpendDisplay,
    apiSpendIsTracked,
    topCaller,
    topNicheMeetings,
  };
}
