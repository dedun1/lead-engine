import { getAuthUser } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = createAdminClient();
  await admin
    .from('generation_jobs')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('id', params.jobId);
  return Response.json({ ok: true });
}
