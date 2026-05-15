import Anthropic from '@anthropic-ai/sdk';
import { MODEL_HAIKU, assertHaikuModel } from '@/lib/ai/anthropic';

export async function testDecryptedApiKey(
  service: string,
  plaintext: string,
): Promise<{ ok: true; note?: string } | { ok: false; error: string }> {
  try {
    if (service === 'anthropic') {
      assertHaikuModel(MODEL_HAIKU);
      const client = new Anthropic({ apiKey: plaintext });
      const response = await client.messages.create({
        model: MODEL_HAIKU,
        max_tokens: 16,
        messages: [
          { role: 'user', content: 'Reply with the word OK only.' },
        ],
      });
      const block = response.content[0];
      const text = block.type === 'text' ? block.text : '';
      if (!text.toUpperCase().includes('OK')) {
        return { ok: false, error: 'Unexpected response from Anthropic' };
      }
      return { ok: true };
    }
    if (!plaintext.trim()) {
      return { ok: false, error: 'Key is empty' };
    }
    return { ok: true, note: 'Test not yet implemented' };
  } catch {
    return { ok: false, error: 'Validation request failed' };
  }
}
