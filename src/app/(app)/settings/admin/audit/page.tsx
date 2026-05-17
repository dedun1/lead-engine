import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchAuditLog } from '@/lib/admin/fetch-audit';
import { ADMIN_AUDIT_TYPES } from '@/lib/admin/audit';
import { AuditTable } from './audit-table';
import { AuditFilters } from './audit-filters';

type SearchParams = {
  start?: string;
  end?: string;
  actors?: string | string[];
  types?: string;
  cursor?: string;
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actorIds = Array.isArray(searchParams.actors)
    ? searchParams.actors
    : searchParams.actors
      ? [searchParams.actors]
      : undefined;
  const activityTypes = searchParams.types?.split(',').filter(Boolean);

  const { rows, nextCursor } = await fetchAuditLog({
    start: searchParams.start,
    end: searchParams.end,
    actor_ids: actorIds,
    activity_types: activityTypes,
    cursor: searchParams.cursor,
  });

  const supabase = createClient();
  const { data: members } = await supabase
    .from('team_members')
    .select('id, display_name, email')
    .order('display_name');

  const defaultEnd = new Date().toISOString().slice(0, 10);
  const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AuditFilters
          members={members ?? []}
          auditTypes={[...ADMIN_AUDIT_TYPES]}
          defaultStart={searchParams.start?.slice(0, 10) ?? defaultStart}
          defaultEnd={searchParams.end?.slice(0, 10) ?? defaultEnd}
        />
        <Link
          href="/settings/admin/export"
          className="text-sm text-primary underline"
        >
          Export audit types →
        </Link>
      </div>
      <AuditTable initialRows={rows} initialCursor={nextCursor} />
    </div>
  );
}
