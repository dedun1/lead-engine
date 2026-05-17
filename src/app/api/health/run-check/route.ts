import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/permissions';
import { hasHealthCheck } from '@/lib/health/source-check-registry';
import {
  listImplementedHealthCheckSources,
  runSourceHealthCheck,
} from '@/lib/health/source-checks';

const bodySchema = z.object({
  source: z.string().min(1).optional(),
  all: z.boolean().optional(),
});

async function runPool(sources: string[], concurrency: number) {
  const results: Array<{ source: string; ok: boolean; skipped?: boolean; error?: string }> =
    [];
  let i = 0;
  async function worker() {
    while (i < sources.length) {
      const source = sources[i++]!;
      if (!hasHealthCheck(source)) {
        results.push({ source, ok: true, skipped: true });
        continue;
      }
      try {
        const r = await runSourceHealthCheck(source);
        results.push({ source, ok: r?.ok ?? false, error: r?.error });
      } catch (e) {
        results.push({
          source,
          ok: false,
          error: e instanceof Error ? e.message : 'Check failed',
        });
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, sources.length) }, () => worker()),
  );
  return results;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    if (parsed.data.source) {
      if (!hasHealthCheck(parsed.data.source)) {
        return NextResponse.json(
          { error: 'Health check not implemented for this source' },
          { status: 400 },
        );
      }
      const result = await runSourceHealthCheck(parsed.data.source);
      return NextResponse.json({ results: [{ source: parsed.data.source, ...result }] });
    }

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data } = await supabase.from('scraper_health').select('source');
    const distinct = [
      ...new Set((data ?? []).map((r) => r.source).filter(Boolean) as string[]),
    ];
    const toRun = parsed.data.all
      ? distinct
      : listImplementedHealthCheckSources().filter((s) => distinct.includes(s));

    const results = await runPool(toRun.length ? toRun : listImplementedHealthCheckSources(), 3);
    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed';
    const status = msg.includes('Admin') || msg === 'Unauthorized' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
