import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type TeamMemberRow =
  Database['public']['Tables']['team_members']['Row'];

export async function getAuthUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getTeamMemberForUser(
  userId: string,
): Promise<TeamMemberRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const member = await getTeamMemberForUser(userId);
  return member?.role === 'admin' && member.is_active !== false;
}

export async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');
  if (!(await isAdmin(user.id))) throw new Error('Admin only');
  return user;
}

export async function getSessionContext() {
  const user = await getAuthUser();
  if (!user) return null;
  const member = await getTeamMemberForUser(user.id);
  const admin =
    member?.role === 'admin' && member.is_active !== false;
  return { user, member, isAdmin: admin };
}
