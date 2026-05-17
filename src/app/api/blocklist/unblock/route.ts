import { NextResponse } from 'next/server';
import { z } from 'zod';
import { removeFromBlocklist } from '@/lib/dedup/blocklist';
import { requireAdmin } from '@/lib/permissions';

const bodySchema = z.object({
  fingerprint: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    await removeFromBlocklist(parsed.data.fingerprint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    const status = msg.includes('Admin') || msg === 'Unauthorized' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
