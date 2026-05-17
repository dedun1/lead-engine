import { payloadSummary } from '@/lib/triggers/display';
import type { TriggerType } from '@/lib/triggers/types';
import type { ActivityFeedEntry } from './types';

function biz(entry: ActivityFeedEntry): string {
  return entry.business_name ?? 'Unknown business';
}

export function entryMainLine(entry: ActivityFeedEntry): string {
  const who = entry.actor_name ?? 'Someone';
  const name = biz(entry);
  const p = entry.payload;

  if (entry.kind === 'call') {
    const outcome = String(p.outcome ?? 'logged');
    const sub = p.sub_outcome ? ` / ${String(p.sub_outcome)}` : '';
    return `${who} called ${name} — ${outcome}${sub}`;
  }
  if (entry.kind === 'status_change') {
    return `${who} changed ${name} from ${String(p.from ?? '?')} to ${String(p.to ?? '?')}`;
  }
  if (entry.kind === 'enrichment_added') {
    return `${who} enriched ${name}`;
  }
  if (entry.kind === 'note_added') {
    return `${who} added note to ${name}`;
  }
  if (entry.kind === 'lead_blocked') {
    return `${who} blocked ${name} — reason: ${String(p.reason ?? '—')}`;
  }
  if (entry.kind === 'generation') {
    const city = String(p.city ?? 'unknown');
    const niche = String(p.niche_name ?? entry.niche_name ?? 'niche');
    const count = Number(p.delivered_count ?? 0);
    return `${who} ran lead generation in ${city}, ${niche} — created ${count} leads`;
  }
  if (entry.kind === 'trigger') {
    return `Trigger fired on ${name}: ${String(p.trigger_type ?? 'event')}`;
  }
  return `${who} — ${entry.kind} on ${name}`;
}

export function entrySubLine(entry: ActivityFeedEntry): string | null {
  const p = entry.payload;

  if (entry.kind === 'call') {
    const notes = String(p.notes ?? p.notes_preview ?? '').trim();
    return notes ? notes.slice(0, 100) + (notes.length > 100 ? '…' : '') : null;
  }
  if (entry.kind === 'note_added') {
    const note = String(p.preview ?? p.note ?? '').trim();
    return note ? note.slice(0, 120) + (note.length > 120 ? '…' : '') : null;
  }
  if (entry.kind === 'enrichment_added') {
    const fields = p.fields_found;
    if (Array.isArray(fields) && fields.length) {
      return `Fields: ${fields.slice(0, 5).join(', ')}`;
    }
    return p.sources ? `Sources: ${String(p.sources)}` : null;
  }
  if (entry.kind === 'generation') {
    const count = Number(p.delivered_count ?? 0);
    if (count === 0) return 'No new leads found';
    const dur =
      p.started_at && p.completed_at
        ? ` · ${Math.round((new Date(String(p.completed_at)).getTime() - new Date(String(p.started_at)).getTime()) / 1000)}s`
        : '';
    return `Status: ${String(p.status ?? '—')}${dur}`;
  }
  if (entry.kind === 'trigger' && p.trigger_type) {
    return payloadSummary(
      String(p.trigger_type) as TriggerType,
      (p.details as Record<string, unknown>) ?? p,
    );
  }
  return null;
}
