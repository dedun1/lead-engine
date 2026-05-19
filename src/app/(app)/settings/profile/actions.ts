'use server';

import { revalidatePath } from 'next/cache';
import { getAuthUser, getTeamMemberForUser, requireAdmin } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { resetOnboardingForUser } from '@/lib/onboarding/actions';

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

export async function updateDisplayName(displayName: string): Promise<ProfileActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Not signed in' };
  const supabase = createClient();
  const { error } = await supabase
    .from('team_members')
    .update({
      display_name: displayName.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/settings/profile');
  return { ok: true };
}

export async function resetMyOnboarding(targetUserId: string): Promise<ProfileActionResult> {
  try {
    await requireAdmin();
    return resetOnboardingForUser(targetUserId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed' };
  }
}

export async function loadProfile() {
  const user = await getAuthUser();
  if (!user) return null;
  const member = await getTeamMemberForUser(user.id);
  if (!member) return null;
  return { user, member };
}
