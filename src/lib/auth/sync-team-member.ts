import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

type InviteMetadata = {
  role?: string;
  display_name?: string;
};

/** Upsert team_members after auth — invite metadata or first-user admin bootstrap. */
export async function syncTeamMemberFromAuth(user: User): Promise<void> {
  if (!user.email) return;

  try {
    const admin = createAdminClient();
    const meta = (user.user_metadata ?? {}) as InviteMetadata;

    const { data: existing } = await admin
      .from('team_members')
      .select('role, display_name')
      .eq('id', user.id)
      .maybeSingle();

    const roleFromMeta =
      meta.role === 'admin' || meta.role === 'member' ? meta.role : null;

    let role: 'admin' | 'member';
    if (roleFromMeta) {
      role = roleFromMeta;
    } else if (existing?.role === 'admin' || existing?.role === 'member') {
      role = existing.role;
    } else {
      const { count } = await admin
        .from('team_members')
        .select('*', { count: 'exact', head: true });
      role = (count ?? 0) === 0 ? 'admin' : 'member';
    }

    const displayName =
      meta.display_name?.trim() ||
      existing?.display_name ||
      user.email.split('@')[0] ||
      'Team member';

    await admin.from('team_members').upsert(
      {
        id: user.id,
        email: user.email,
        display_name: displayName,
        role,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  } catch {
    // Auth session is still valid; profile sync can be retried on next login.
  }
}
