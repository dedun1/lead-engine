import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/permissions';
import { SettingsNav } from './settings-nav';
import { AdminAccessToast } from './admin-access-toast';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-6 py-10">
      <SettingsNav isAdmin={ctx.isAdmin} />
      <div className="min-w-0 flex-1">
        <Suspense fallback={null}>
          <AdminAccessToast />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
