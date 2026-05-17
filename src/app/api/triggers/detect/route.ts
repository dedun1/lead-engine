import { NextResponse } from 'next/server';
import { detectAllTriggers } from '@/lib/triggers/coordinator';
import { requireAdmin } from '@/lib/permissions';

export async function POST() {
  try {
    await requireAdmin();
    const result = await detectAllTriggers();
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    const status = msg === 'Unauthorized' || msg === 'Admin only' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
