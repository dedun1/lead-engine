import { createHash } from 'crypto';

/** PROJECT_SPEC §5.1 — do not change without explicit approval. */
export function generateFingerprint(input: {
  business_name: string;
  business_phone?: string | null;
  owner_phone?: string | null;
  postal_code?: string | null;
}): string {
  const normalizedName = input.business_name
    .toLowerCase()
    .replace(/\b(llc|inc|ltd|corp|company|co|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
  const normalizedPhone = (input.business_phone || input.owner_phone || '')
    .replace(/\D/g, '')
    .slice(-10);
  const postal = (input.postal_code || '').replace(/\s/g, '').toUpperCase();
  return createHash('sha256')
    .update(`${normalizedName}|${normalizedPhone}|${postal}`)
    .digest('hex');
}
