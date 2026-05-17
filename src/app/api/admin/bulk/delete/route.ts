import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit } from '@/lib/admin/audit';
import { fetchLeadIdsMatching, type BulkLeadFilters } from '@/lib/admin/bulk-filters';
import { deleteLeadsCascade } from '@/lib/admin/delete-lead-cascade';
import { requireAdminApi } from '@/lib/admin/require-admin';

const schema = z.object({
  filters: z.object({
    niche_id: z.string().uuid(),
    region: z.string().optional(),
    statuses: z.array(z.string()).optional(),
    assigned_to: z.string().uuid().optional(),
  }),
  confirm: z.literal('DELETE'),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { filters } = parsed.data;
  const supabase = createAdminClient();
  const ids = await fetchLeadIdsMatching(supabase, filters as BulkLeadFilters);
  const count = ids.length;

  await logAdminAudit({
    actor_id: auth.id,
    activity_type: 'bulk_deleted',
    lead_id: null,
    payload: { filters, count },
  });

  try {
    await deleteLeadsCascade(supabase, ids);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Delete failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count });
}
