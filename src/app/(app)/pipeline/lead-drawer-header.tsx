'use client';

import { Copy, Phone, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatForDisplay, formatForTelLink } from '@/lib/phone';
import type { LeadDetail } from '@/lib/pipeline/types';
import type { LeadStatus } from '@/lib/pipeline/types';
import { LeadStatusBadge } from './lead-status-badge';
import { LeadDrawerActions } from './lead-drawer-actions';

type TeamMember = { id: string; display_name: string | null; email: string };

export function LeadDrawerHeader({
  lead,
  isAdmin,
  teamMembers,
  onClose,
  onCall,
  onQueue,
  onDone,
}: {
  lead: LeadDetail;
  isAdmin: boolean;
  teamMembers: TeamMember[];
  onClose: () => void;
  onCall: () => void;
  onQueue: () => void;
  onDone: () => void;
}) {
  return (
    <SheetHeader className="space-y-3 border-b px-6 py-4 text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2 pr-8">
          <SheetTitle className="text-2xl">{lead.business_name}</SheetTitle>
          <LeadStatusBadge status={(lead.status as LeadStatus) ?? 'new'} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-12 top-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <LeadDrawerActions lead={lead} isAdmin={isAdmin} teamMembers={teamMembers} onDone={onDone} />
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button size="lg" onClick={onCall} disabled={!lead.business_phone}>
          <Phone className="mr-2 h-4 w-4" />
          Call Now
        </Button>
        {lead.status === 'new' && (
          <Button variant="secondary" onClick={onQueue}>
            Add to Call Queue
          </Button>
        )}
        {lead.business_phone && (
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              void navigator.clipboard.writeText(
                formatForDisplay(lead.business_phone!),
              );
              toast.success('Copied');
            }}
          >
            {formatForDisplay(lead.business_phone)}
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </SheetHeader>
  );
}
