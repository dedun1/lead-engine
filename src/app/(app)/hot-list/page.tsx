import { HotListClient } from './hot-list-client';
import { fetchActiveTriggers, fetchLastTriggerRefresh } from './fetch-triggers';
import { getAuthUser, isAdmin } from '@/lib/permissions';
import { fetchTeamMembers } from '../pipeline/actions-fetch';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 30;

export default async function HotListPage() {
  const user = await getAuthUser();
  const [triggers, lastRefresh, admin, teamMembers] = await Promise.all([
    fetchActiveTriggers({ sort: 'severity' }),
    fetchLastTriggerRefresh(),
    user ? isAdmin(user.id) : Promise.resolve(false),
    fetchTeamMembers(),
  ]);

  const supabase = createClient();
  const { data: niches } = await supabase
    .from('niches')
    .select('id, name')
    .eq('is_actively_pitching', true)
    .order('name');

  const regions = [
    ...new Set(triggers.map((t) => t.lead.region).filter(Boolean) as string[]),
  ].sort();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <HotListClient
        initialTriggers={triggers}
        lastRefresh={lastRefresh}
        isAdmin={admin}
        niches={niches ?? []}
        regions={regions}
        teamMembers={teamMembers}
        userId={user?.id ?? null}
      />
    </div>
  );
}
