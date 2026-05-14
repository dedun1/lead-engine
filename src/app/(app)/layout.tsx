import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/shell/sidebar';

// Defense-in-depth: middleware already redirects unauthenticated traffic, but
// re-validating here means a stale cookie or middleware miss can't render
// authenticated UI shells. getUser() round-trips to Supabase — safer than
// getSession() which trusts the cookie.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar userEmail={user.email ?? null} />
      <main className="ml-16 min-h-screen">{children}</main>
    </div>
  );
}
