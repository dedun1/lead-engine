import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { countLeadsMatching, type BulkLeadFilters } from '@/lib/admin/bulk-filters';
import { requireAdminApi } from '@/lib/admin/require-admin';

const schema = z.object({
  niche_id: z.string().uuid(),
  region: z.string().optional(),
  statuses: z.array(z.string()).optional(),
  assigned_to: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const filters = parsed.data as BulkLeadFilters;
  const supabase = createAdminClient();
  const count = await countLeadsMatching(supabase, filters);
  return NextResponse.json({ count });
}
