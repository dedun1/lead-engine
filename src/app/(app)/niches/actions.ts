'use server';

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import type { FetchNichesParams, NicheRecord } from '@/lib/niches/types';

export type ActionResult = { ok: true } | { ok: false; error: string };

export type SeedRunResult =
  | { ok: true; stdout: string }
  | { ok: false; error: string; stdout?: string };

export async function fetchNiches(
  params: FetchNichesParams,
): Promise<NicheRecord[]> {
  const supabase = createClient();
  let query = supabase
    .from('niches')
    .select(
      'id, naics_code, name, country_scope, is_shortlist, is_favorited, is_actively_pitching, parent_sector, weather_sensitive, created_at',
    )
    .order('name');

  if (params.shortlist_only) {
    query = query.eq('is_shortlist', true);
  }
  if (params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${term},naics_code.ilike.${term}`);
  }
  if (params.countries.length > 0) {
    query = query.overlaps('country_scope', params.countries);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchNiches failed');
    return [];
  }
  return (data ?? []) as NicheRecord[];
}

export async function getNicheCount(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('niches')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}

export async function toggleFavorited(nicheId: string): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const { data: row, error: readErr } = await supabase
      .from('niches')
      .select('is_favorited')
      .eq('id', nicheId)
      .single();
    if (readErr || !row) return { ok: false, error: 'Niche not found' };

    const { error } = await supabase
      .from('niches')
      .update({
        is_favorited: !row.is_favorited,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nicheId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/niches');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to update favorite' };
  }
}

export async function toggleActivelyPitching(
  nicheId: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createClient();
    const { data: row, error: readErr } = await supabase
      .from('niches')
      .select('is_actively_pitching')
      .eq('id', nicheId)
      .single();
    if (readErr || !row) return { ok: false, error: 'Niche not found' };

    const { error } = await supabase
      .from('niches')
      .update({
        is_actively_pitching: !row.is_actively_pitching,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nicheId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/niches');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update pitching flag';
    return { ok: false, error: message };
  }
}

export async function runSeed(
  type: 'niches' | 'shortlist',
): Promise<SeedRunResult> {
  try {
    await requireAdmin();
    const script = resolve(process.cwd(), `scripts/seed-${type}.ts`);

    return await new Promise<SeedRunResult>((resolvePromise) => {
      let stdout = '';
      const proc = spawn('pnpm', ['exec', 'tsx', script], {
        cwd: process.cwd(),
        env: process.env,
        shell: true,
      });
      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      proc.stderr.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      proc.on('close', (code) => {
        if (code === 0) {
          revalidatePath('/niches');
          resolvePromise({ ok: true, stdout: stdout.trim() });
        } else {
          resolvePromise({
            ok: false,
            error: `Seed exited with code ${code ?? 'unknown'}`,
            stdout: stdout.trim(),
          });
        }
      });
      proc.on('error', () => {
        resolvePromise({ ok: false, error: 'Failed to start seed process' });
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Seed failed';
    return { ok: false, error: message };
  }
}
