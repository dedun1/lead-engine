import { readFileSync } from 'node:fs';
import Papa from 'papaparse';

/** Parse CSV, skipping # comment lines. */
export function parseCsvFile(filePath: string): Record<string, string>[] {
  const raw = readFileSync(filePath, 'utf-8');
  const body = raw
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');
  const parsed = Papa.parse<Record<string, string>>(body, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? 'CSV parse failed');
  }
  return parsed.data;
}
