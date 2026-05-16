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

const STATUS_CLASS: Record<string, string> = {
  verified: 'bg-green-100 text-green-800',
  risky: 'bg-yellow-100 text-yellow-800',
  invalid: 'bg-red-100 text-red-800',
  unverified: 'bg-gray-100 text-gray-700',
};

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
          <Check className="h-3 w-3 text-green-600" />
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
                {e.source} · {e.success ? 'ok' : 'fail'} · {e.duration_ms}ms
                {e.error ? ` · ${e.error}` : ''}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
