import { DateTime } from 'luxon';
import { createClient } from '@/lib/supabase/server';

const CAIRO = 'Africa/Cairo';

/** Count call_attempts in the Cairo week that starts on weekStart (Monday ISO date). */
export async function countCallsInCairoWeek(weekStart: string): Promise<number> {
  const start = DateTime.fromISO(weekStart, { zone: CAIRO }).startOf('day');
  const end = start.plus({ days: 7 }).minus({ milliseconds: 1 });
  const supabase = createClient();
  const { count } = await supabase
    .from('call_attempts')
    .select('id', { count: 'exact', head: true })
    .gte('called_at', start.toUTC().toISO()!)
    .lte('called_at', end.toUTC().toISO()!);
  return count ?? 0;
}
