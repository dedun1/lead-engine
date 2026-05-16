import { HOOK_TYPES, type OpenerGenerationResult } from './opener-types';

export function isOpenerGenerationResult(v: unknown): v is OpenerGenerationResult {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  if (typeof o.opener_text !== 'string' || !o.opener_text.trim()) return false;
  if (!HOOK_TYPES.includes(o.hook_type as (typeof HOOK_TYPES)[number])) {
    return false;
  }
  if (!Array.isArray(o.personalization_signals_used)) return false;
  if (typeof o.predicted_open_rate !== 'number') return false;
  if (o.predicted_open_rate < 0 || o.predicted_open_rate > 1) return false;
  return true;
}
