import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateWeeklyInsight } from '@/lib/ai/weekly-insight';
import { hasAnthropicKey } from '@/lib/ai/anthropic';
import { CryptoError } from '@/lib/crypto';
import { countCallsInCairoWeek } from '@/lib/dashboard/week-call-count';
import { weekStartingMondayCairo } from '@/lib/dashboard/date-range';
import { getAuthUser, isAdmin } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

const MIN_CALLS_THIS_WEEK = 10;

const bodySchema = z.object({
  force_regenerate: z.boolean().optional().default(false),
});

async function readBody(request: Request): Promise<z.infer<typeof bodySchema>> {
  const text = await request.text();
  if (!text.trim()) return { force_regenerate: false };
  try {
    const json: unknown = JSON.parse(text);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) throw new Error('schema');
    return parsed.data;
  } catch {
    throw new Error('invalid_json');
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: z.infer<typeof bodySchema>;
    try {
      body = await readBody(request);
    } catch (err) {
      const kind = err instanceof Error ? err.message : 'unknown';
      console.warn('[weekly-insight] invalid body', { kind });
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const force = body.force_regenerate === true;
    if (force && !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const hasKey = await hasAnthropicKey();
    if (!hasKey) {
      return NextResponse.json({ state: 'no_anthropic_key' });
    }

    const weekStart = weekStartingMondayCairo();
    const callsMade = await countCallsInCairoWeek(weekStart);
    if (callsMade < MIN_CALLS_THIS_WEEK) {
      return NextResponse.json({
        state: 'insufficient_data',
        calls_needed: MIN_CALLS_THIS_WEEK,
        calls_made: callsMade,
      });
    }

    const supabase = createClient();

    if (!force) {
      const { data: existing } = await supabase
        .from('weekly_insights')
        .select('*')
        .eq('week_starting', weekStart)
        .maybeSingle();

      if (existing?.headline_observation || existing?.insight_text) {
        return NextResponse.json({ state: 'cached', insight: existing });
      }
    }

    await generateWeeklyInsight(user.id);
    const { data: row } = await supabase
      .from('weekly_insights')
      .select('*')
      .eq('week_starting', weekStart)
      .maybeSingle();

    return NextResponse.json({ state: 'generated', insight: row });
  } catch (error) {
    if (error instanceof CryptoError) {
      return NextResponse.json({ state: 'no_anthropic_key' });
    }
    const message =
      error instanceof Error ? error.message : 'Generation failed';
    console.error('[weekly-insight] failed', { message });
    return NextResponse.json({ state: 'error', error: message }, { status: 500 });
  }
}
