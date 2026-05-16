import { callHaiku } from '@/lib/ai/anthropic';
import { safeParseJson } from '@/lib/ai/parse-json';
import {
  OPENER_BASELINE_PROMPT_SYSTEM,
  OPENER_BASELINE_PROMPT_USER,
} from '@/lib/ai/prompts';
import type { OpenerGenerationResult } from '@/lib/ai/opener-types';
import { isOpenerGenerationResult } from '@/lib/ai/validate-opener';
import { createClient } from '@/lib/supabase/server';

export async function generateNicheBaselineVariants(params: {
  nicheId: string;
  country: string;
  userId: string;
  numVariants?: number;
}): Promise<{ variants: OpenerGenerationResult[]; error?: string }> {
  const supabase = createClient();
  const num = params.numVariants ?? 5;

  const { data: niche } = await supabase
    .from('niches')
    .select('id, name')
    .eq('id', params.nicheId)
    .maybeSingle();
  if (!niche) return { variants: [], error: 'Niche not found' };

  const { data: intel } = await supabase
    .from('niche_intelligence')
    .select('summary')
    .eq('niche_id', params.nicheId)
    .eq('country', params.country)
    .maybeSingle();
  if (!intel?.summary) {
    return {
      variants: [],
      error: `Generate niche intelligence first for ${params.country}`,
    };
  }

  const inserted: OpenerGenerationResult[] = [];

  for (let seed = 1; seed <= num; seed++) {
    const { text } = await callHaiku({
      systemPrompt: OPENER_BASELINE_PROMPT_SYSTEM,
      userPrompt: OPENER_BASELINE_PROMPT_USER(
        niche.name,
        intel.summary,
        seed,
      ),
      maxTokens: 1024,
    });

    const json = safeParseJson<OpenerGenerationResult>(text);
    if (!json || !isOpenerGenerationResult(json)) {
      return { variants: inserted, error: 'Malformed Claude JSON on baseline' };
    }

    await supabase.from('pitch_opener_variants').insert({
      niche_id: params.nicheId,
      lead_id: null,
      country: params.country,
      is_personalized: false,
      is_active: true,
      name: `Baseline ${seed}`,
      opener_text: json.opener_text,
      hook_type: json.hook_type,
      personalization_signals_used: json.personalization_signals_used,
      predicted_open_rate: json.predicted_open_rate,
      created_by_id: params.userId,
      times_used: 0,
      meetings_set: 0,
    });

    inserted.push(json);
  }

  return { variants: inserted };
}

export async function countBaselineVariants(nicheId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('pitch_opener_variants')
    .select('*', { count: 'exact', head: true })
    .eq('niche_id', nicheId)
    .eq('is_personalized', false);
  return count ?? 0;
}
