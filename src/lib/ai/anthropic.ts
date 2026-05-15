import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt, CryptoError } from '@/lib/crypto';
import type { HaikuUsage } from '@/lib/ai/types';

export const MODEL_HAIKU = 'claude-haiku-4-5';

let cachedKey: string | null = null;
let cachedClient: Anthropic | null = null;

export function assertHaikuModel(model: string): void {
  if (model !== MODEL_HAIKU) {
    throw new Error(`Only ${MODEL_HAIKU} is allowed in this app`);
  }
}

export async function getAnthropicClient(): Promise<Anthropic> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('api_keys')
    .select('encrypted_value')
    .eq('service', 'anthropic')
    .maybeSingle();

  if (error || !data?.encrypted_value) {
    throw new CryptoError('Anthropic key not configured');
  }

  let apiKey: string;
  try {
    apiKey = decrypt(data.encrypted_value);
  } catch {
    throw new CryptoError('Anthropic key not configured');
  }

  if (cachedKey === apiKey && cachedClient) return cachedClient;
  cachedKey = apiKey;
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

async function estimateHaikuCost(
  inputTokens: number,
  outputTokens: number,
): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('pricing_config')
      .select('cost_usd')
      .eq('source', 'claude_haiku_niche_card')
      .maybeSingle();
    const perNiche = Number(data?.cost_usd ?? 0.005);
    const tokenFactor = (inputTokens + outputTokens) / 4000;
    return Math.round(perNiche * Math.max(1, tokenFactor) * 10000) / 10000;
  } catch {
    return 0.005;
  }
}

export async function callHaiku(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; usage: HaikuUsage }> {
  assertHaikuModel(MODEL_HAIKU);
  const client = await getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: MODEL_HAIKU,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.7,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userPrompt }],
    });

    const block = response.content[0];
    const text = block.type === 'text' ? block.text : '';
    const input_tokens = response.usage.input_tokens;
    const output_tokens = response.usage.output_tokens;
    const estimated_cost_usd = await estimateHaikuCost(
      input_tokens,
      output_tokens,
    );

    return {
      text,
      usage: { input_tokens, output_tokens, estimated_cost_usd },
    };
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? String((error as { status: number }).status)
        : 'unknown';
    console.error('Anthropic API error, status:', status);
    throw error;
  }
}
