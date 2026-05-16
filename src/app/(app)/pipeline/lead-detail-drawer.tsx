'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatForTelLink } from '@/lib/phone';
import type { LeadDetail, LeadStatus } from '@/lib/pipeline/types';
import { LeadOverviewTab } from './lead-overview-tab';
import { LeadIntelligenceTab } from './lead-intelligence-tab';
import { LeadActivityTab } from './lead-activity-tab';
import { LeadRawTab } from './lead-raw-tab';
import { LeadStatusChanger } from './lead-status-changer';
import { LeadDrawerHeader } from './lead-drawer-header';
import { fetchLeadById } from './actions-fetch';
import { OutcomeModal } from '@/app/(app)/call-queue/outcome-modal';
import { recordOpenerUseOnCall } from '@/lib/opener/record-use';
import { assignLead, queueLead, updateLeadStatus } from './actions-mutations';

type TeamMember = { id: string; display_name: string | null; email: string };

type Props = {
  leadId: string | null;
  open: boolean;
  isAdmin: boolean;
  teamMembers: TeamMember[];
  onClose: () => void;
  onRefresh: () => void;
};

export function LeadDetailDrawer({
  leadId,
  open,
  isAdmin,
  teamMembers,
  onClose,
  onRefresh,
}: Props) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusDraft, setStatusDraft] = useState<LeadStatus>('new');
  const [assignDraft, setAssignDraft] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<string | null>(null);
  const [activeOpenerVariantId, setActiveOpenerVariantId] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    const data = await fetchLeadById(leadId);
    setLead(data);
    if (data) {
      setStatusDraft((data.status as LeadStatus) ?? 'new');
      setAssignDraft(data.assigned_to);
    }
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    if (open && leadId) void load();
  }, [open, leadId, load]);

  const saveFooter = async () => {
    if (!lead) return;
    if (statusDraft !== lead.status) await updateLeadStatus(lead.id, statusDraft);
    if (assignDraft !== lead.assigned_to) await assignLead(lead.id, assignDraft);
    setDirty(false);
    toast.success('Saved');
    onRefresh();
    void load();
  };

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-[560px]">
        {loading && !lead && (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        )}
        {lead && (
          <>
            <LeadDrawerHeader
              lead={lead}
              isAdmin={isAdmin}
              teamMembers={teamMembers}
              onClose={onClose}
              onDone={() => {
                onClose();
                onRefresh();
              }}
              onCall={() => {
                if (!lead.business_phone) {
                  toast.error('No phone number');
                  return;
                }
                window.location.href = formatForTelLink(lead.business_phone);
                setCallStartedAt(new Date().toISOString());
                void recordOpenerUseOnCall(lead.id).then(({ openerVariantId }) => {
                  setActiveOpenerVariantId(openerVariantId);
                  setOutcomeOpen(true);
                });
              }}
              onQueue={() => void queueLead(lead.id).then(() => {
                toast.success('Queued');
                onRefresh();
                void load();
              })}
            />
            <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-6 mt-2 w-auto justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                {isAdmin && <TabsTrigger value="raw">Raw data</TabsTrigger>}
              </TabsList>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <TabsContent value="overview" className="mt-0">
                  <LeadOverviewTab
                    lead={lead}
                    isAdmin={isAdmin}
                    onRefresh={() => {
                      void load();
                      onRefresh();
                    }}
                  />
                </TabsContent>
                <TabsContent value="intelligence" className="mt-0">
                  <LeadIntelligenceTab lead={lead} isAdmin={isAdmin} />
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
            <div className="sticky bottom-0 border-t bg-background px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <LeadStatusChanger
                  value={statusDraft}
                  onChange={(s) => {
                    setStatusDraft(s);
                    setDirty(true);
                  }}
                />
                <select
                  className="h-10 rounded-md border bg-background px-2 text-sm"
                  value={assignDraft ?? ''}
                  onChange={(e) => {
                    setAssignDraft(e.target.value || null);
                    setDirty(true);
                  }}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name ?? m.email}
                    </option>
                  ))}
                </select>
                {dirty && (
                  <>
                    <Button size="sm" onClick={() => void saveFooter()}>
                      Save changes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setStatusDraft((lead.status as LeadStatus) ?? 'new');
                        setAssignDraft(lead.assigned_to);
                        setDirty(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>

    <OutcomeModal
      open={outcomeOpen}
      leadId={lead?.id ?? null}
      businessName={lead?.business_name ?? null}
      calledAt={callStartedAt}
      openerVariantId={activeOpenerVariantId}
      onSaved={() => {
        setOutcomeOpen(false);
        setCallStartedAt(null);
        setActiveOpenerVariantId(null);
        void load();
        onRefresh();
      }}
    />
    </>
  );
}
