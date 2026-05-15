'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUser, requireAdmin } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function inviteTeamMember(
  email: string,
  role: 'admin' | 'member',
  displayName?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes('@')) {
      return { ok: false, error: 'Invalid email' };
    }

    const admin = createAdminClient();
    const origin =
      headers().get('origin') ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'http://localhost:3000';
    const redirectTo = `${origin.replace(/\/$/, '')}/callback`;

    const { error } = await admin.auth.admin.inviteUserByEmail(trimmedEmail, {
      data: {
        role,
        display_name: displayName?.trim() || null,
      },
      redirectTo,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath('/team');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invite failed';
    return { ok: false, error: message };
  }
}

export async function updateTeamMemberRole(
  memberId: string,
  role: 'admin' | 'member',
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    if (memberId === user.id && role !== 'admin') {
      return { ok: false, error: 'You cannot remove your own admin role' };
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('team_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/team');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Update failed';
    return { ok: false, error: message };
  }
}

export async function setTeamMemberActive(
  memberId: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    if (memberId === user.id && !active) {
      return { ok: false, error: 'You cannot deactivate your own account' };
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('team_members')
      .update({
        is_active: active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/team');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Update failed';
    return { ok: false, error: message };
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getAuthUser();
  return user?.id ?? null;
}
