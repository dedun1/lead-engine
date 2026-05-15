import Anthropic from '@anthropic-ai/sdk';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

export async function testDecryptedApiKey(
  service: string,
  plaintext: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (service === 'anthropic') {
      const client = new Anthropic({ apiKey: plaintext });
      await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return { ok: true };
    }
    // Other services: minimal stub until real validators land in later phases.
    if (!plaintext.trim()) {
      return { ok: false, error: 'Key is empty' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Validation request failed' };
  }
}
