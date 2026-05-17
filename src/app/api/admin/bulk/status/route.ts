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
  target_status: z.string(),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { filters, target_status } = parsed.data;
  const supabase = createAdminClient();
  const ids = await fetchLeadIdsMatching(supabase, filters as BulkLeadFilters);

  await logAdminAudit({
    actor_id: auth.id,
    activity_type: 'bulk_status_updated',
    lead_id: null,
    payload: { filters, target_status, count: ids.length },
  });

  for (const leadId of ids) {
    const { data: lead } = await supabase
      .from('leads')
      .select('status')
      .eq('id', leadId)
      .single();
    const from = lead?.status ?? 'unknown';
    await supabase.from('leads').update({ status: target_status }).eq('id', leadId);
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      actor_id: auth.id,
      activity_type: 'bulk_status_updated',
      payload: { from, to: target_status },
    });
  }

  return NextResponse.json({ ok: true, count: ids.length });
}
