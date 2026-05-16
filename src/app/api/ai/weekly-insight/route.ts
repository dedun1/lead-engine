import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateWeeklyInsight } from '@/lib/ai/weekly-insight';
import { CryptoError } from '@/lib/crypto';
import { getAuthUser, isAdmin } from '@/lib/permissions';
import { weekStartingMondayCairo } from '@/lib/dashboard/date-range';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  force_regenerate: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const force = parsed.data.force_regenerate === true;
    if (force && !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const weekStart = weekStartingMondayCairo();
    const supabase = createClient();

    if (!force) {
      const { data: existing } = await supabase
        .from('weekly_insights')
        .select('*')
        .eq('week_starting', weekStart)
        .maybeSingle();

      if (existing?.headline_observation || existing?.insight_text) {
        return NextResponse.json({ insight: existing });
      }
    }

    const generated = await generateWeeklyInsight(user.id);
    const { data: row } = await supabase
      .from('weekly_insights')
      .select('*')
      .eq('week_starting', weekStart)
      .maybeSingle();

    return NextResponse.json({ insight: row ?? generated });
  } catch (error) {
    if (error instanceof CryptoError) {
      return NextResponse.json(
        { error: 'Anthropic key not configured' },
        { status: 503 },
      );
    }
    const message =
      error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
