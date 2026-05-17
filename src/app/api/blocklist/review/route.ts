import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/permissions';

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const admin = createAdminClient();
    await admin
      .from('blocked_fingerprints')
      .update({ last_reviewed_at: now, updated_at: now })
      .in('id', parsed.data.ids);

    return NextResponse.json({ ok: true, count: parsed.data.ids.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    const status = msg.includes('Admin') || msg === 'Unauthorized' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
