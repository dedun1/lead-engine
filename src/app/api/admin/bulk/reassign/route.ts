import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit } from '@/lib/admin/audit';
import { fetchLeadIdsMatching, type BulkLeadFilters } from '@/lib/admin/bulk-filters';
import { requireAdminApi } from '@/lib/admin/require-admin';

const schema = z.object({
  filters: z.object({
    niche_id: z.string().uuid(),
    region: z.string().optional(),
    statuses: z.array(z.string()).optional(),
    assigned_to: z.string().uuid().optional(),
  }),
  target_member_ids: z.array(z.string().uuid()).min(1),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { filters, target_member_ids } = parsed.data;
  const supabase = createAdminClient();
  const ids = await fetchLeadIdsMatching(supabase, filters as BulkLeadFilters);
  const count = ids.length;

  await logAdminAudit({
    actor_id: auth.id,
    activity_type: 'bulk_reassigned',
    lead_id: null,
    payload: { filters, target_member_ids, count },
  });

  const target = target_member_ids[0];
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: target })
      .in('id', chunk);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, count });
}
