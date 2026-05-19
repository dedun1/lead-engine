'use server';

import { revalidatePath } from 'next/cache';
import { encrypt, getLastFour } from '@/lib/crypto';
import { testDecryptedApiKey } from '@/lib/api-keys/test-key';
import { getAuthUser, getTeamMemberForUser } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import type { OnboardingContext } from './state';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function getOnboardingContext(): Promise<OnboardingContext | null> {
  const user = await getAuthUser();
  if (!user) return null;
  const member = await getTeamMemberForUser(user.id);
  if (!member || member.is_active === false) return null;

  const supabase = createClient();
  const { count } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  const showNicheStep = (count ?? 0) <= 1;

  return {
    memberId: member.id,
    email: member.email,
    displayName: member.display_name,
    role: member.role,
    completedOnboarding: Boolean(member.completed_onboarding),
    anthropicKeyDeferred: Boolean(member.anthropic_key_deferred),
    showNicheStep,
    isAdmin: member.role === 'admin',
  };
}

export async function saveOnboardingProfile(input: {
  display_name: string;
  role?: 'admin' | 'member';
}): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const supabase = createClient();
  const { count } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  const isFirstUser = (count ?? 0) <= 1;
  const role = isFirstUser ? 'admin' : (input.role ?? 'member');

  const { error } = await supabase
    .from('team_members')
    .update({
      display_name: input.display_name.trim() || null,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function testOnboardingAnthropicKey(
  plaintext: string,
): Promise<ActionResult> {
  const trimmed = plaintext.trim();
  if (!trimmed) return { ok: false, error: 'Key cannot be empty' };
  const result = await testDecryptedApiKey('anthropic', trimmed);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export async function saveOnboardingAnthropicKey(
  plaintext: string,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Not signed in' };
  const member = await getTeamMemberForUser(user.id);
  if (member?.role !== 'admin') {
    return { ok: false, error: 'Only admins can save API keys' };
  }

  const trimmed = plaintext.trim();
  if (!trimmed) return { ok: false, error: 'Key cannot be empty' };

  const test = await testDecryptedApiKey('anthropic', trimmed);
  if (!test.ok) return { ok: false, error: test.error };

  const supabase = createClient();
  const { error } = await supabase.from('api_keys').upsert(
    {
      service: 'anthropic',
      encrypted_value: encrypt(trimmed),
      last_four: getLastFour(trimmed),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'service' },
  );
  if (error) return { ok: false, error: error.message };

  await supabase
    .from('team_members')
    .update({ anthropic_key_deferred: false, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function deferOnboardingAnthropicKey(): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Not signed in' };
  const supabase = createClient();
  const { error } = await supabase
    .from('team_members')
    .update({
      anthropic_key_deferred: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function selectOnboardingNiche(nicheId: string): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Not signed in' };
  const member = await getTeamMemberForUser(user.id);
  if (member?.role !== 'admin') {
    return { ok: false, error: 'Admin only' };
  }

  const supabase = createClient();
  const { data: niche, error: readErr } = await supabase
    .from('niches')
    .select('is_actively_pitching, country_scope')
    .eq('id', nicheId)
    .single();
  if (readErr || !niche) return { ok: false, error: 'Niche not found' };

  if (!niche.is_actively_pitching) {
    const { error } = await supabase
      .from('niches')
      .update({
        is_actively_pitching: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nicheId);
    if (error) return { ok: false, error: error.message };

    const country = niche.country_scope?.[0] ?? 'US';
    const { triggerBaselineGenerationIfNeeded } = await import(
      '@/lib/opener/actions'
    );
    void triggerBaselineGenerationIfNeeded(nicheId, country);
  }

  return { ok: true };
}

export async function completeOnboarding(): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Not signed in' };
  const supabase = createClient();
  const { error } = await supabase
    .from('team_members')
    .update({
      completed_onboarding: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function resetOnboardingForUser(
  targetUserId: string,
): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: 'Not signed in' };
  const actor = await getTeamMemberForUser(user.id);
  if (actor?.role !== 'admin') return { ok: false, error: 'Admin only' };

  const supabase = createClient();
  const { error } = await supabase
    .from('team_members')
    .update({
      completed_onboarding: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}
