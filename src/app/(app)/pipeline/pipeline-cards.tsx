'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatForDisplay, formatForTelLink } from '@/lib/phone';
import type { PipelineLeadRow } from '@/lib/pipeline/types';
import { LeadStatusBadge } from './lead-status-badge';

export function PipelineCards({
  leads,
  onOpenLead,
}: {
  leads: PipelineLeadRow[];
  onOpenLead: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => (
        <Card
          key={lead.id}
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onOpenLead(lead.id)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{lead.business_name}</CardTitle>
            <LeadStatusBadge status={lead.status} />
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {lead.business_phone && (
              <a
                href={formatForTelLink(lead.business_phone)}
                onClick={(e) => e.stopPropagation()}
                className="text-primary underline"
              >
                {formatForDisplay(lead.business_phone)}
              </a>
            )}
            <p>{[lead.city, lead.region].filter(Boolean).join(', ')}</p>
            {lead.google_rating != null && (
              <p>
                ★ {lead.google_rating} ({lead.google_review_count ?? 0} reviews)
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
