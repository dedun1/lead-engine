import type { Database } from '@/types/database.types';

type Activity = Database['public']['Tables']['lead_activities']['Row'];

export function formatActivityDescription(
  activity: Activity,
  actorName?: string | null,
): string {
  const who = actorName ?? 'Someone';
  const payload = (activity.payload ?? {}) as Record<string, unknown>;
  switch (activity.activity_type) {
    case 'call':
      return `${who} called — outcome: ${String(payload.outcome ?? 'logged')}`;
    case 'status_change':
      return `Status changed: ${String(payload.from ?? '?')} → ${String(payload.to ?? '?')}`;
    case 'note_added':
      return `${who} added a note`;
    case 'owner_assigned':
    case 'reassigned':
      return `${who} reassigned lead`;
    case 'enrichment_added':
      return `Enrichment added: ${String(payload.source ?? 'source')}`;
    case 'lead_blocked':
      return `${who} blocked this lead`;
    case 'lead_unblocked':
      return `${who} unblocked this lead`;
    case 'dnc_marked':
      return `${who} marked DNC`;
    case 'lead_created':
      return 'Lead created from generation';
    default:
      return activity.activity_type ?? 'Activity';
  }
}

export function formatLastActivitySummary(
  type: string | null,
): string {
  if (!type) return '';
  if (type === 'call') return 'called';
  if (type === 'status_change') return 'status updated';
  if (type === 'note_added') return 'note';
  return type.replace(/_/g, ' ');
}
