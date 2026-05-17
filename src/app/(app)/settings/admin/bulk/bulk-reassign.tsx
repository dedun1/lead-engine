'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { BulkFilterFields } from './bulk-filter-fields';
import { fetchBulkPreviewCount } from './bulk-preview';

type Niche = { id: string; name: string };
type Member = { id: string; display_name: string | null; email: string };

export function BulkReassign({
  niches,
  members,
}: {
  niches: Niche[];
  members: Member[];
}) {
  const [nicheId, setNicheId] = useState('');
  const [region, setRegion] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [targetId, setTargetId] = useState('');
  const [preview, setPreview] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filters = {
    niche_id: nicheId,
    region: region || undefined,
    statuses: statuses.length ? statuses : undefined,
    assigned_to: assignedTo || undefined,
  };

  async function runPreview() {
    if (!nicheId) {
      toast.error('Niche is required');
      return;
    }
    try {
      setPreview(await fetchBulkPreviewCount(filters));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Preview failed');
    }
  }

  async function runReassign() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bulk/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          target_member_ids: [targetId],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      toast.success(`Reassigned ${json.count} leads`);
      setConfirmOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reassign failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bulk reassign leads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BulkFilterFields
          niches={niches}
          nicheId={nicheId}
          onNicheId={setNicheId}
          region={region}
          onRegion={setRegion}
          statuses={statuses}
          onStatuses={setStatuses}
          assignedTo={assignedTo}
          onAssignedTo={setAssignedTo}
          members={members}
        />
        <div>
          <Label>Assign to</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger>
              <SelectValue placeholder="Team member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.display_name ?? m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {preview != null && (
          <p className="text-sm text-muted-foreground">
            This will reassign <strong>{preview}</strong> leads.
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void runPreview()}>
            Preview count
          </Button>
          <Button
            type="button"
            disabled={!targetId || preview == null || preview === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Reassign
          </Button>
        </div>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm reassign</AlertDialogTitle>
              <AlertDialogDescription>
                Reassign {preview} leads to the selected member?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={loading} onClick={() => void runReassign()}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
