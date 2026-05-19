'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { LeadDetail } from '@/lib/pipeline/types';
import type { SourceLogEntry } from '@/lib/enrich/types';

function formatSourceLogLine(e: SourceLogEntry): string {
  if (e.kind === 'provenance' || e.source === 'lead_generation') {
    return `${e.source} · imported`;
  }
  // Legacy rows: lead-gen used google_maps_scrape without a success flag → showed as fail
  if (
    e.source === 'google_maps_scrape' &&
    e.google_place_id != null &&
    e.success === undefined
  ) {
    return 'lead_generation · imported (legacy)';
  }
  const ms = typeof e.duration_ms === 'number' ? e.duration_ms : 0;
  const status = e.success ? 'ok' : 'fail';
  return `${e.source} · ${status} · ${ms}ms${e.error ? ` · ${e.error}` : ''}`;
}

import { EMAIL_STATUS_CLASS } from '@/lib/ui/semantic-classes';

const STATUS_CLASS = EMAIL_STATUS_CLASS;

type Props = {
  lead: LeadDetail;
  isAdmin: boolean;
};

export function EnrichmentDisplay({ lead, isAdmin }: Props) {
  const [logOpen, setLogOpen] = useState(false);
  const reg = lead.business_registration as {
    registered_name?: string;
    registry?: string;
    status?: string;
    officers?: Array<{ name: string; role: string }>;
  } | null;

  const sourceLog = (lead.source_log as SourceLogEntry[] | null) ?? [];

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      {lead.owner_name && (
        <p className="text-base font-semibold">Owner: {lead.owner_name}</p>
      )}
      {lead.owner_email && (
        <div className="flex flex-wrap items-center gap-2">
          <a className="text-primary underline" href={`mailto:${lead.owner_email}`}>
            {lead.owner_email}
          </a>
          <button type="button" onClick={() => copy(lead.owner_email!)}>
            <Copy className="h-3.5 w-3.5" />
          </button>
          {lead.owner_email_status && (
            <Badge className={STATUS_CLASS[lead.owner_email_status] ?? ''}>
              {lead.owner_email_status}
            </Badge>
          )}
        </div>
      )}
      {lead.owner_linkedin_url && (
        <a
          href={lead.owner_linkedin_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary underline"
        >
          LinkedIn profile <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {reg && (
        <Collapsible>
          <CollapsibleTrigger className="text-sm font-medium underline">
            Registered as {reg.registered_name ?? '—'} ({reg.registry}, {reg.status ?? 'unknown'})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1 text-xs text-muted-foreground">
            {(reg.officers ?? []).map((o) => (
              <p key={`${o.name}-${o.role}`}>
                {o.name} — {o.role}
              </p>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
      {lead.enriched_at && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="h-3 w-3 text-chart-3" />
          Enriched {new Date(lead.enriched_at).toLocaleString()}
        </p>
      )}
      {isAdmin && sourceLog.length > 0 && (
        <Collapsible open={logOpen} onOpenChange={setLogOpen}>
          <CollapsibleTrigger className="text-xs text-muted-foreground underline">
            Source log ({sourceLog.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 max-h-40 overflow-y-auto font-mono text-xs">
            {sourceLog.map((e, i) => (
              <div key={i} className="border-b py-1">
                {formatSourceLogLine(e)}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
