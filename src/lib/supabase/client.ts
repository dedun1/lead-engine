/**
 * Browser-side Supabase client. Use inside React Client Components only.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY — both are
 * safe to expose to the browser because RLS policies enforce per-row access.
 *
 * Do NOT import this from server code, Server Components, or API routes —
 * use `./server.ts` (auth cookie aware) or `./admin.ts` (service role, bypasses
 * RLS) instead. See CLAUDE.md architecture principles.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
