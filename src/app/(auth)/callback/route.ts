import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncTeamMemberFromAuth } from '@/lib/auth/sync-team-member';

// Magic-link callback. Exchanges ?code= for a session, syncs team_members, then redirects.
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await syncTeamMemberFromAuth(user);
    }
  } catch {
    return NextResponse.redirect(
      new URL('/login?error=callback_failed', requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
