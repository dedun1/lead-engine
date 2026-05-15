import { createAdminClient } from '@/lib/supabase/admin';

export async function getJobStatus(jobId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('generation_jobs')
    .select('status')
    .eq('id', jobId)
    .maybeSingle();
  return data;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
