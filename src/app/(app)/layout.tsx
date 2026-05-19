import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/shell/sidebar';
import { AppShell } from '@/components/shell/app-shell';
import { getOnboardingContext } from '@/lib/onboarding/actions';
import { fetchNiches } from '@/app/(app)/niches/actions';

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

  const [onboarding, shortlistNiches] = await Promise.all([
    getOnboardingContext(),
    fetchNiches({ shortlist_only: true, search: '', countries: [] }),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar userEmail={user.email ?? null} />
      <main className="ml-16 min-h-screen">
        <AppShell onboarding={onboarding} shortlistNiches={shortlistNiches}>
          {children}
        </AppShell>
      </main>
    </div>
  );
}
