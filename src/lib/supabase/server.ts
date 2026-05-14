/**
 * Server-side Supabase client. Use in Server Components, Server Actions, and
 * route handlers under /api.
 *
 * Reads the auth cookie from the incoming request, so queries run as the
 * authenticated user and RLS applies. Uses the anon key — for elevated
 * operations that need to bypass RLS (seed jobs, scraper pipelines, admin
 * batch ops), use `./admin.ts` instead.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies() is read-only.
            // Session refresh happens in src/middleware.ts, so this is safe to swallow.
          }
        },
      },
    },
  );
}
