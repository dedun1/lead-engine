import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Magic-link callback. Supabase redirects here with ?code=... after the user
// clicks the email link. We exchange the code for a session cookie, then
// forward the user to ?next= (preserved from /login) or root if absent.
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  // Only allow internal redirects — never bounce to an external host.
  const safeNext = next.startsWith('/') ? next : '/';

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', requestUrl.origin),
    );
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          requestUrl.origin,
        ),
      );
    }
  } catch {
    return NextResponse.redirect(
      new URL('/login?error=callback_failed', requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
