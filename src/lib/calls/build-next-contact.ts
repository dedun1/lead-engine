/** Combine date (+ optional time) into ISO for next_contact_date. */
export function buildNextContactIso(
  date: Date | undefined,
  timeValue: string,
  includeTime: boolean,
): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (includeTime && timeValue) {
    const [h, m] = timeValue.split(':').map((v) => parseInt(v, 10));
    d.setHours(Number.isNaN(h) ? 9 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d.toISOString();
}
