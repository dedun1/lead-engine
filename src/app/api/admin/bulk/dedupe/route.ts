import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit } from '@/lib/admin/audit';
import { buildDedupeGroups, type DedupeLeadRow } from '@/lib/admin/dedupe';
import { mergeLeadIntoPrimary } from '@/lib/admin/delete-lead-cascade';
import { requireAdminApi } from '@/lib/admin/require-admin';
const previewSchema = z.object({
  action: z.literal('preview'),
  niche_id: z.string().uuid().optional(),
});

const mergeSchema = z.object({
  action: z.literal('merge'),
  primary_id: z.string().uuid(),
  duplicate_ids: z.array(z.string().uuid()).min(1),
  understood: z.literal(true),
});

const blockSchema = z.object({
  action: z.literal('block'),
  fingerprints: z.array(z.string()).min(1),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();

  const preview = previewSchema.safeParse(body);
  if (preview.success) {
    const supabase = createAdminClient();
    let q = supabase
      .from('leads')
      .select(
        'id, business_name, fingerprint, business_phone, website, last_called_at',
      )
      .limit(5000);
    if (preview.data.niche_id) q = q.eq('niche_id', preview.data.niche_id);
    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const groups = buildDedupeGroups((data ?? []) as DedupeLeadRow[]);
    return NextResponse.json({ groups });
  }

  const merge = mergeSchema.safeParse(body);
  if (merge.success) {
    const { primary_id, duplicate_ids } = merge.data;
    const deleteCount = duplicate_ids.filter((id) => id !== primary_id).length;
    await logAdminAudit({
      actor_id: auth.id,
      activity_type: 'bulk_deleted',
      lead_id: null,
      payload: {
        op: 'dedupe_merge',
        primary_id,
        duplicate_ids,
        deleteCount,
      },
    });
    const supabase = createAdminClient();
    try {
      await mergeLeadIntoPrimary(supabase, primary_id, duplicate_ids);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Merge failed';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ ok: true, merged: deleteCount });
  }

  const block = blockSchema.safeParse(body);
  if (block.success) {
    const supabase = createAdminClient();
    const rows = block.data.fingerprints.map((fp) => ({
      fingerprint: fp,
      blocked_by: auth.id,
      reason: block.data.reason ?? 'Bulk dedupe block',
      blocked_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('blocked_fingerprints').upsert(rows, {
      onConflict: 'fingerprint',
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, blocked: rows.length });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
