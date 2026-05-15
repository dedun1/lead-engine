/** Strip markdown fences and preamble before JSON.parse. */
export function stripJsonWrapper(raw: string): string {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();
  const jsonStart = text.indexOf('{');
  const arrStart = text.indexOf('[');
  const start =
    jsonStart === -1
      ? arrStart
      : arrStart === -1
        ? jsonStart
        : Math.min(jsonStart, arrStart);
  if (start > 0) text = text.slice(start);
  return text.trim();
}

/** Never throws — returns null on failure. */
export function safeParseJson<T>(raw: string): T | null {
  try {
    const cleaned = stripJsonWrapper(raw);
    return JSON.parse(cleaned) as T;
  } catch {
    const preview = raw.slice(0, 200).replace(/\s+/g, ' ');
    console.error('safeParseJson failed:', preview);
    return null;
  }
}
