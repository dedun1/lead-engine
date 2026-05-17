import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';

/** Returns admin user or a 403 response — check with `instanceof NextResponse`. */
export async function requireAdminApi() {
  try {
    return await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
}
