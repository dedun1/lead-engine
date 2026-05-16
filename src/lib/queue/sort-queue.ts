import type { QueueLeadRow } from './types';

const STATUS_PRIORITY: Record<string, number> = {
  queued: 0,
  contacted: 1,
};

/** Assigned to me first, then status priority, then oldest first (FIFO). */
export function sortQueueLeads(
  leads: QueueLeadRow[],
  userId: string,
): QueueLeadRow[] {
  return [...leads].sort((a, b) => {
    const aMine = a.assigned_to === userId ? 0 : 1;
    const bMine = b.assigned_to === userId ? 0 : 1;
    if (aMine !== bMine) return aMine - bMine;

    const aStatus = STATUS_PRIORITY[a.status] ?? 9;
    const bStatus = STATUS_PRIORITY[b.status] ?? 9;
    if (aStatus !== bStatus) return aStatus - bStatus;

    return (
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });
}
