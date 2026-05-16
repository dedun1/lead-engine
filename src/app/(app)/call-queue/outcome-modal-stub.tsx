'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { recordCallAttemptStub } from '@/lib/queue/state';
import type { StubOutcomeChoice } from '@/lib/queue/types';

type Props = {
  open: boolean;
  leadId: string | null;
  businessName: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function OutcomeModalStub({
  open,
  leadId,
  businessName,
  onOpenChange,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);

  const save = async (choice: StubOutcomeChoice) => {
    if (!leadId) return;
    setSaving(true);
    const res = await recordCallAttemptStub(leadId, choice);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log call outcome</DialogTitle>
          <DialogDescription>
            Outcome logging UI coming in BUILD Prompt 19. For now: did you reach
            them?
            {businessName ? (
              <span className="mt-1 block font-medium text-foreground">
                {businessName}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button disabled={saving} onClick={() => void save('yes')}>
            Yes
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => void save('no')}
          >
            No
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => void save('voicemail')}
          >
            Voicemail
          </Button>
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
