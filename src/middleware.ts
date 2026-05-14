/**
 * Next.js middleware: refreshes the Supabase session on every request and
 * redirects unauthenticated visitors to /login if they hit a protected route.
 *
 * Route groups (auth) and (app) don't appear in URLs, so we whitelist the
 * known public paths explicitly. Everything else requires a logged-in user.
 *
 * See BUILD_INSTRUCTIONS section 4: invite-only, magic-link auth, no public signup.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

// Routes accessible without an authenticated session.
const PUBLIC_PATHS = ['/login', '/auth/callback', '/auth/confirm'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mutate the incoming request's cookies so the downstream getUser()
          // call sees any session refresh from Supabase.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Re-issue the response with refreshed Set-Cookie headers.
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() validates the session against Supabase Auth.
  // Do NOT use getSession() in middleware — it trusts the cookie without revalidation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Preserve the original destination so /login can redirect back after auth.
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     *   - _next/static (Next.js static assets)
     *   - _next/image (Next.js image optimizer)
     *   - favicon.ico
     *   - common image extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
