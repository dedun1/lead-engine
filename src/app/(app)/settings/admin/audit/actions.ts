'use server';

import { fetchAuditLog } from '@/lib/admin/fetch-audit';
import { requireAdmin } from '@/lib/permissions';

export async function loadMoreAuditAction(params: {
  start?: string;
  end?: string;
  actor_ids?: string[];
  activity_types?: string[];
  cursor: string;
}) {
  await requireAdmin();
  return fetchAuditLog({ ...params, limit: 50 });
}
