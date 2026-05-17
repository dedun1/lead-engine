import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/permissions';

const bodySchema = z.object({ source: z.string().min(1) });

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: row } = await admin
      .from('scraper_health')
      .select('id')
      .eq('source', parsed.data.source)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row?.id) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    await admin
      .from('scraper_health')
      .update({
        is_disabled: false,
        consecutive_failures: 0,
        status: 'healthy',
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    const status = msg.includes('Admin') || msg === 'Unauthorized' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
