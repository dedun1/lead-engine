import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/permissions';
import { AdminSubNav } from './admin-sub-nav';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');
  if (!ctx.isAdmin) redirect('/settings?adminRequired=1');

  return (
    <div>
      <div className="mb-4 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Tenant-wide stats, exports, bulk ops, and audit trail.
        </p>
      </div>
      <AdminSubNav />
      {children}
    </div>
  );
}
