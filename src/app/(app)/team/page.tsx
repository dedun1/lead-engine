import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { InviteDialog } from './invite-dialog';
import { TeamTable } from './team-table';

export default async function TeamPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const supabase = createClient();
  const { data: members } = await supabase
    .from('team_members')
    .select('id, display_name, email, role, is_active')
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            Invite-only members with admin or member roles.
          </p>
        </div>
        {ctx.isAdmin && <InviteDialog />}
      </div>
      <TeamTable
        members={members ?? []}
        isAdmin={ctx.isAdmin}
        currentUserId={ctx.user.id}
      />
      {!ctx.isAdmin && (
        <p className="text-xs text-muted-foreground">
          Read-only — contact an admin to invite or change roles.
        </p>
      )}
    </div>
  );
}
