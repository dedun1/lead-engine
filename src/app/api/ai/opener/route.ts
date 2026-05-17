import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callHaiku } from '@/lib/ai/anthropic';
import { safeParseJson } from '@/lib/ai/parse-json';
import {
  OPENER_GENERATION_PROMPT_SYSTEM,
  OPENER_GENERATION_PROMPT_USER,
} from '@/lib/ai/prompts';
import type { OpenerGenerationResult } from '@/lib/ai/opener-types';
import {
  allowOpenerGeneration,
  openerRetryAfterSeconds,
} from '@/lib/ai/rate-limit';
import { isOpenerGenerationResult } from '@/lib/ai/validate-opener';
import { CryptoError } from '@/lib/crypto';
import { loadLeadOpenerContext } from '@/lib/opener/lead-context';
import { getAuthUser } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { payloadSummary } from '@/lib/triggers/display';
import type { TriggerType } from '@/lib/triggers/types';

const bodySchema = z.object({
  lead_id: z.string().uuid(),
  refresh: z.boolean().optional(),
  variant_seed: z.number().int().min(1).max(5).optional(),
  trigger_id: z.string().uuid().optional(),
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

    const { lead_id, refresh, variant_seed, trigger_id } = parsed.data;
    const supabase = createClient();

    const ctx = await loadLeadOpenerContext(lead_id);
    if (!ctx) {
      const { data: leadRow } = await supabase
        .from('leads')
        .select('niche_id')
        .eq('id', lead_id)
        .maybeSingle();
      if (!leadRow) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      const nid = leadRow.niche_id ?? 'unknown';
      return NextResponse.json(
        {
          error: `Generate niche intelligence first at /niches (niche ${nid})`,
        },
        { status: 400 },
      );
    }

    const { data: cached } = await supabase
      .from('pitch_opener_variants')
      .select('*')
      .eq('lead_id', lead_id)
      .eq('is_personalized', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached && !refresh) {
      return NextResponse.json(
        { row: cached, estimated_cost_usd: null },
        { headers: { 'x-cache-hit': 'true' } },
      );
    }

    if (!allowOpenerGeneration(user.id)) {
      const retry = openerRetryAfterSeconds(user.id);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again shortly.' },
        { status: 503, headers: { 'Retry-After': String(retry || 60) } },
      );
    }

    let triggerContext: { trigger_type: string; payload_summary: string } | null =
      null;
    if (trigger_id) {
      const { data: trig } = await supabase
        .from('trigger_events')
        .select('trigger_type, details')
        .eq('id', trigger_id)
        .eq('lead_id', lead_id)
        .maybeSingle();
      if (trig?.trigger_type) {
        triggerContext = {
          trigger_type: trig.trigger_type,
          payload_summary: payloadSummary(
            trig.trigger_type as TriggerType,
            trig.details as Record<string, unknown> | null,
          ),
        };
      }
    }

    const seed = variant_seed ?? Math.floor(Math.random() * 5) + 1;
    const { text, usage } = await callHaiku({
      systemPrompt: OPENER_GENERATION_PROMPT_SYSTEM,
      userPrompt: OPENER_GENERATION_PROMPT_USER({
        niche_name: ctx.niche.name,
        niche_summary: ctx.intelligence.summary ?? '',
        pain_points: ctx.intelligence.pain_points ?? [],
        twentyfour_pitch_angles: ctx.intelligence.twentyfour_pitch_angles ?? [],
        business_name: ctx.lead.business_name,
        rating: ctx.lead.google_rating,
        review_count: ctx.lead.google_review_count,
        city: ctx.lead.city,
        region: ctx.lead.region,
        is_open_now: ctx.is_open_now,
        has_website: Boolean(ctx.lead.has_website),
        owner_name: ctx.lead.owner_name,
        variant_seed: seed,
        trigger_context: triggerContext,
      }),
      maxTokens: 1024,
    });

    const json = safeParseJson<OpenerGenerationResult>(text);
    if (!json || !isOpenerGenerationResult(json)) {
      return NextResponse.json(
        { error: 'Claude returned malformed JSON', raw_preview: text.slice(0, 200) },
        { status: 502 },
      );
    }

    const now = new Date().toISOString();
    const rowPayload = {
      lead_id,
      niche_id: ctx.lead.niche_id,
      country: ctx.lead.country,
      is_personalized: true,
      is_active: true,
      is_edited: false,
      name: 'Personalized',
      opener_text: json.opener_text,
      hook_type: json.hook_type,
      personalization_signals_used: json.personalization_signals_used,
      predicted_open_rate: json.predicted_open_rate,
      created_by_id: user.id,
      updated_at: now,
      times_used: 0,
      meetings_set: 0,
      trigger_event_id: trigger_id ?? null,
    };

    let row;
    if (cached && refresh) {
      const { data: updated, error: upErr } = await supabase
        .from('pitch_opener_variants')
        .update(rowPayload)
        .eq('id', cached.id)
        .select('*')
        .single();
      if (upErr || !updated) {
        return NextResponse.json({ error: 'Failed to save opener' }, { status: 500 });
      }
      row = updated;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('pitch_opener_variants')
        .insert(rowPayload)
        .select('*')
        .single();
      if (insErr || !inserted) {
        return NextResponse.json({ error: 'Failed to save opener' }, { status: 500 });
      }
      row = inserted;
    }

    await supabase
      .from('leads')
      .update({ current_opener_variant_id: row.id, updated_at: now })
      .eq('id', lead_id);

    return NextResponse.json(
      { row, estimated_cost_usd: usage.estimated_cost_usd },
      { headers: { 'x-cache-hit': 'false' } },
    );
  } catch (error) {
    if (error instanceof CryptoError) {
      return NextResponse.json(
        { error: 'Anthropic key not configured. Admin must set it in Settings.' },
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
    return NextResponse.json({ error: 'Opener generation failed' }, { status: 500 });
  }
}
