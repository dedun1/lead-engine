'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatForDisplay, formatForTelLink } from '@/lib/phone';
import type { LeadDetail } from '@/lib/pipeline/types';
import { fetchLeadById } from '@/app/(app)/pipeline/actions-fetch';
import { LeadOverviewTab } from '@/app/(app)/pipeline/lead-overview-tab';
import { LeadIntelligenceTab } from '@/app/(app)/pipeline/lead-intelligence-tab';
import { LeadActivityTab } from '@/app/(app)/pipeline/lead-activity-tab';
import { LeadRawTab } from '@/app/(app)/pipeline/lead-raw-tab';

const NOTES_FIELD_ID = 'call-queue-quick-notes';

type Props = {
  leadId: string | null;
  isAdmin: boolean;
  atEnd: boolean;
  calledToday: number;
  onCall: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function CallQueueMain({
  leadId,
  isAdmin,
  atEnd,
  calledToday,
  onCall,
  onPrev,
  onNext,
}: Props) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!leadId) {
      setLead(null);
      return;
    }
    setLoading(true);
    const data = await fetchLeadById(leadId);
    setLead(data);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (atEnd) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-2xl font-semibold">🎉 Queue complete</p>
        <p className="text-muted-foreground">
          {calledToday} lead{calledToday === 1 ? '' : 's'} called today. View activity
          in /history
        </p>
        <Button asChild>
          <Link href="/history">View history</Link>
        </Button>
      </div>
    );
  }

  if (!leadId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Select a lead from the queue
      </div>
    );
  }

  if (loading && !lead) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Loading lead…
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Lead not found
      </div>
    );
  }

  const phoneDisplay = lead.business_phone
    ? formatForDisplay(lead.business_phone)
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{lead.business_name}</h1>
            {lead.owner_name && (
              <p className="text-sm text-muted-foreground">{lead.owner_name}</p>
            )}
          </div>
          <Button size="lg" className="gap-2" onClick={onCall}>
            <Phone className="h-5 w-5" />
            Call Now
          </Button>
        </div>
        {phoneDisplay ? (
          <a
            href={formatForTelLink(lead.business_phone!)}
            className="mt-4 block text-4xl font-bold tracking-tight hover:underline"
          >
            {phoneDisplay}
          </a>
        ) : (
          <p className="mt-4 text-lg text-muted-foreground">No phone on file</p>
        )}
      </div>

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-8 mt-2 w-auto justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          {isAdmin && <TabsTrigger value="raw">Raw data</TabsTrigger>}
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-4">
          <TabsContent value="overview" className="mt-0">
            <LeadOverviewTab lead={lead} notesFieldId={NOTES_FIELD_ID} />
          </TabsContent>
          <TabsContent value="intelligence" className="mt-0">
            <LeadIntelligenceTab lead={lead} />
          </TabsContent>
          <TabsContent value="activity" className="mt-0">
            <LeadActivityTab lead={lead} />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="raw" className="mt-0">
              <LeadRawTab lead={lead} />
            </TabsContent>
          )}
        </div>
      </Tabs>

      <div className="flex items-center justify-between border-t px-8 py-4">
        <Button variant="outline" size="lg" className="gap-2" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
          Previous lead
        </Button>
        <Button size="lg" className="gap-2" onClick={onNext}>
          Next lead
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export { NOTES_FIELD_ID };
