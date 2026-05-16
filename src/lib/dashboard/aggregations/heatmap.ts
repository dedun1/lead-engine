import type { HeatmapCell } from '../types';
import type { SlimCall } from '../call-metrics';
import { isAnswered, isInterested } from '../call-metrics';

export function getCallTimingHeatmap(calls: SlimCall[]): {
  cells: HeatmapCell[];
  bestSlot: HeatmapCell | null;
} {
  const grid = new Map<string, { calls: number; answered: number; interested: number }>();

  for (const c of calls) {
    const day = c.prospect_local_day;
    const hour = c.prospect_local_hour;
    if (day == null || hour == null) continue;
    const key = `${day}-${hour}`;
    const cell = grid.get(key) ?? { calls: 0, answered: 0, interested: 0 };
    cell.calls += 1;
    if (isAnswered(c.outcome)) cell.answered += 1;
    if (isInterested(c.sub_outcome)) cell.interested += 1;
    grid.set(key, cell);
  }

  const cells: HeatmapCell[] = [];
  let best: HeatmapCell | null = null;

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const cell = grid.get(`${day}-${hour}`) ?? {
        calls: 0,
        answered: 0,
        interested: 0,
      };
      const connect = cell.calls > 0 ? cell.answered / cell.calls : 0;
      const interested = cell.answered > 0 ? cell.interested / cell.answered : 0;
      const entry: HeatmapCell = {
        day,
        hour,
        calls: cell.calls,
        connect_rate: connect,
        interested_rate: interested,
      };
      cells.push(entry);
      if (cell.calls >= 20 && (!best || connect > best.connect_rate)) {
        best = entry;
      }
    }
  }

  return { cells, bestSlot: best };
}
