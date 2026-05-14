import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Default landing logic per PROJECT_SPEC §12:
//   1. If active triggers exist → /hot-list
//   2. Else if leads in 'queued' or callbacks due → /call-queue
//   3. Else → /pipeline
//
// Phase 1 has no trigger / queue data yet, so we always fall through to
// /hot-list (whose empty state is the friendliest first-login surface).
// The richer branching reads land alongside Phase 5 / Phase 7 — both
// trigger_events and a status-filtered leads query become available there.
export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  redirect('/hot-list');
}
