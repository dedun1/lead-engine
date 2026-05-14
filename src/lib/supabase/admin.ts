/**
 * Service-role Supabase client. Bypasses RLS — use with care.
 *
 * Allowed contexts (server-only):
 *   - /api routes that need elevated access (seed jobs, scraper pipelines,
 *     batch operations, admin endpoints)
 *   - scripts/ utilities (seed-niches, generate-types, etc.)
 *
 * NEVER import this from client code, Server Components rendered for an
 * unauthenticated user, or any path where the service role key could leak to
 * the browser bundle. The service role bypasses every RLS policy.
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix — server-only env).
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
