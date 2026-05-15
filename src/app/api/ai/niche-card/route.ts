import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callHaiku } from '@/lib/ai/anthropic';
import { cardToDbRow } from '@/lib/ai/map-card-to-row';
import { safeParseJson } from '@/lib/ai/parse-json';
import {
  NICHE_INTELLIGENCE_PROMPT_SYSTEM,
  NICHE_INTELLIGENCE_PROMPT_USER,
} from '@/lib/ai/prompts';
import { allowNicheCardGeneration, retryAfterSeconds } from '@/lib/ai/rate-limit';
import type { NicheIntelligenceCard } from '@/lib/ai/types';
import { isNicheIntelligenceCard } from '@/lib/ai/validate-card';
import { CryptoError } from '@/lib/crypto';
import { getAuthUser } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  niche_id: z.string().uuid(),
  country: z.string().min(2).max(8),
  refresh: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { niche_id, country, refresh } = parsed.data;
    const supabase = createClient();

    const { data: niche, error: nicheErr } = await supabase
      .from('niches')
      .select('id, name, country_scope')
      .eq('id', niche_id)
      .maybeSingle();

    if (nicheErr || !niche) {
      return NextResponse.json({ error: 'Niche not found' }, { status: 404 });
    }

    const scope = niche.country_scope ?? [];
    if (!scope.includes(country)) {
      return NextResponse.json(
        { error: 'Country not in niche scope' },
        { status: 400 },
      );
    }

    const { data: cached } = await supabase
      .from('niche_intelligence')
      .select('*')
      .eq('niche_id', niche_id)
      .eq('country', country)
      .maybeSingle();

    if (cached && !refresh) {
      return NextResponse.json(
        { row: cached, estimated_cost_usd: null },
        { headers: { 'x-cache-hit': 'true' } },
      );
    }

    if (!allowNicheCardGeneration(user.id)) {
      const retry = retryAfterSeconds(user.id);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again shortly.' },
        {
          status: 503,
          headers: { 'Retry-After': String(retry || 60) },
        },
      );
    }

    const { text, usage } = await callHaiku({
      systemPrompt: NICHE_INTELLIGENCE_PROMPT_SYSTEM,
      userPrompt: NICHE_INTELLIGENCE_PROMPT_USER(niche.name, country),
      maxTokens: 4096,
    });

    const json = safeParseJson<NicheIntelligenceCard>(text);
    if (!json || !isNicheIntelligenceCard(json)) {
      return NextResponse.json(
        {
          error: 'Claude returned malformed JSON',
          raw_preview: text.slice(0, 200),
        },
        { status: 502 },
      );
    }

    const now = new Date().toISOString();
    const row = cardToDbRow(json, {
      niche_id,
      country,
      generation_source: refresh ? 'claude_web_search' : 'claude_knowledge',
      edited_by: user.id,
      generated_at: now,
    });

    const { data: upserted, error: upsertErr } = await supabase
      .from('niche_intelligence')
      .upsert(row, { onConflict: 'niche_id,country' })
      .select('*')
      .single();

    if (upsertErr || !upserted) {
      return NextResponse.json({ error: 'Failed to save intelligence' }, { status: 500 });
    }

    return NextResponse.json(
      { row: upserted, estimated_cost_usd: usage.estimated_cost_usd },
      { headers: { 'x-cache-hit': 'false' } },
    );
  } catch (error) {
    if (error instanceof CryptoError) {
      return NextResponse.json(
        {
          error:
            'Anthropic key not configured. Admin must set it in Settings.',
        },
        { status: 500 },
      );
    }
    const status =
      error && typeof error === 'object' && 'status' in error
        ? Number((error as { status: number }).status)
        : 0;
    if (status === 429 || status >= 500) {
      return NextResponse.json(
        { error: 'Anthropic service unavailable. Retry shortly.' },
        { status: 503, headers: { 'Retry-After': '30' } },
      );
    }
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
