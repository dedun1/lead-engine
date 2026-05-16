'use client';

import { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { isOpenNow, type WeeklyHours } from '@/lib/hours';
import { formatForDisplay, formatForTelLink } from '@/lib/phone';
import type { LeadDetail } from '@/lib/pipeline/types';
import {
  googleMapsUrl,
  leadTypesFromSource,
  parseWeeklyHours,
} from '@/lib/pipeline/lead-utils';
import { getHoursDot, HOURS_DOT_CLASS } from '@/lib/pipeline/hours-indicator';
import { EnrichButton } from '@/components/pipeline/enrich-button';
import { EnrichmentDisplay } from '@/components/pipeline/enrichment-display';
import { updateLeadNotes } from './actions-mutations';

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

function HoursGrid({ hours, timezone }: { hours: WeeklyHours; timezone: string }) {
  const today = DAYS[DateTime.now().setZone(timezone).weekday - 1];
  return (
    <div className="grid grid-cols-2 gap-1 text-xs">
      {DAYS.map((day) => {
        const slot = hours[day];
        let label = 'Closed';
        if (slot === '24_7') label = '24 hours';
        else if (slot !== 'closed' && slot?.length) {
          label = slot.map((r) => `${r.open}–${r.close}`).join(', ');
        }
        return (
          <div
            key={day}
            className={`rounded px-2 py-1 capitalize ${day === today ? 'bg-muted font-medium' : ''}`}
          >
            <span className="text-muted-foreground">{day.slice(0, 3)}</span>{' '}
            {label}
          </div>
        );
      })}
    </div>
  );
}

export function LeadOverviewTab({
  lead,
  notesFieldId,
  isAdmin,
  onRefresh,
}: {
  lead: LeadDetail;
  notesFieldId?: string;
  isAdmin?: boolean;
  onRefresh?: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [expanded, setExpanded] = useState(false);
  const hours = parseWeeklyHours(lead.business_hours);
  const tz = lead.timezone ?? 'America/New_York';
  const localNow = DateTime.now().setZone(tz).toFormat('h:mm a z');
  const types = leadTypesFromSource(lead);
  const maps = googleMapsUrl(lead);
  const dot = getHoursDot(hours, tz);
  const open = hours ? isOpenNow(hours, tz) : null;

  useEffect(() => {
    setNotes(lead.notes ?? '');
  }, [lead.id, lead.notes]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (notes !== (lead.notes ?? '')) {
        void updateLeadNotes(lead.id, notes);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [notes, lead.id, lead.notes]);

  const preview = useMemo(() => {
    if (expanded || notes.length <= 200) return notes;
    return `${notes.slice(0, 200)}…`;
  }, [notes, expanded]);

  return (
    <div className="space-y-6 text-sm">
      <section className="space-y-2">
        <h3 className="font-semibold">Contact</h3>
        {lead.business_phone ? (
          <p>
            <a className="text-primary underline" href={formatForTelLink(lead.business_phone)}>
              {formatForDisplay(lead.business_phone)}
            </a>
          </p>
        ) : (
          <p className="text-muted-foreground">No business phone</p>
        )}
        <EnrichmentDisplay lead={lead} isAdmin={isAdmin ?? false} />
        <EnrichButton
          leadId={lead.id}
          enrichedAt={lead.enriched_at ?? null}
          onDone={() => onRefresh?.()}
        />
        {lead.website && (
          <p>
            <a
              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              {lead.website}
            </a>
          </p>
        )}
        {maps && (
          <p>
            <a href={maps} target="_blank" rel="noreferrer" className="text-primary underline">
              Open in Google Maps
            </a>
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Location</h3>
        <p>{lead.address ?? '—'}</p>
        <p className="text-muted-foreground">
          {[lead.city, lead.region, lead.country].filter(Boolean).join(', ')}
        </p>
        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          Map coming later
          {lead.latitude != null && lead.longitude != null && (
            <span className="mt-1 block">
              Lat: {lead.latitude}, Lng: {lead.longitude}
            </span>
          )}
        </div>
        <p>
          Timezone: {tz} · Local time: <strong>{localNow}</strong>
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Business signals</h3>
        {lead.google_rating != null && (
          <p className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
            {lead.google_rating} ({lead.google_review_count ?? 0} reviews)
          </p>
        )}
        {types.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {types.map((t) => (
              <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${HOURS_DOT_CLASS[dot]}`} />
          {open === null ? 'Hours unknown' : open ? 'Open now' : 'Closed now'}
        </p>
        {hours && <HoursGrid hours={hours} timezone={tz} />}
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Quick notes</h3>
        <Textarea
          id={notesFieldId}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">Autosaves after you stop typing.</p>
        {!expanded && notes.length > 200 && (
          <button type="button" className="text-xs text-primary underline" onClick={() => setExpanded(true)}>
            Show full
          </button>
        )}
        {preview !== notes && <p className="text-muted-foreground">{preview}</p>}
      </section>
    </div>
  );
}
