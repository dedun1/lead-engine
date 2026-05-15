import { safeParseJson } from '../src/lib/ai/parse-json';

const sample =
  'Here is the JSON:\n```json\n{"summary":"ok","automation_demand_score":7}\n```';
const parsed = safeParseJson<{ summary: string }>(sample);
if (!parsed?.summary) {
  console.error('parse-json smoke check failed');
  process.exit(1);
}
console.log('OK');
