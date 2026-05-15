/** Best-effort postal code from a full address string. */
export function parsePostalFromAddress(
  address: string,
  country: string,
): string | null {
  if (!address) return null;
  if (country === 'US') {
    const m = address.match(/\b(\d{5})(?:-\d{4})?\b/);
    return m?.[1] ?? null;
  }
  if (country === 'CA') {
    const m = address.match(/\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i);
    return m?.[1]?.replace(/\s/g, '').toUpperCase() ?? null;
  }
  if (country === 'UK') {
    const m = address.match(
      /\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i,
    );
    return m?.[1]?.replace(/\s/g, '').toUpperCase() ?? null;
  }
  if (country === 'AU') {
    const m = address.match(/\b(\d{4})\b/);
    return m?.[1] ?? null;
  }
  return null;
}
