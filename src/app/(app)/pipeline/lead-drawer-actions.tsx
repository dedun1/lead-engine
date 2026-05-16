'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import type { LeadDetail } from '@/lib/pipeline/types';
import { blockLead, deleteLead, markDnc } from './actions-mutations';

type TeamMember = { id: string; display_name: string | null; email: string };

export function LeadDrawerActions({
  lead,
  isAdmin,
  onDone,
}: {
  lead: LeadDetail;
  isAdmin: boolean;
  teamMembers: TeamMember[];
  onDone: () => void;
}) {
  const [blockOpen, setBlockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="absolute right-4 top-4">
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setBlockOpen(true)}>
            Block this lead
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Reassign (use footer dropdown)</DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              const r = await markDnc(lead.id, 'Marked DNC from pipeline');
              if (r.ok) onDone();
            }}
          >
            Mark DNC
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Fingerprint goes on the permanent blocklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const r = await blockLead(lead.id, reason || 'Blocked from pipeline');
                if (r.ok) onDone();
              }}
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All activity rows are removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => {
                const r = await deleteLead(lead.id);
                if (r.ok) onDone();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
