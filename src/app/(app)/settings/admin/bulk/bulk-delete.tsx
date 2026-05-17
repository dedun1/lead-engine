'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function BulkDelete({ niches, members }: { niches: Niche[]; members: Member[] }) {
  const [nicheId, setNicheId] = useState('');
  const [region, setRegion] = useState('');
  const [statuses, setStatuses] = useState<string[]>(['dead']);
  const [assignedTo, setAssignedTo] = useState('');
  const [preview, setPreview] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const filters = {
    niche_id: nicheId,
    region: region || undefined,
    statuses: statuses.length ? statuses : undefined,
    assigned_to: assignedTo || undefined,
  };

  async function runPreview() {
    if (!nicheId) return toast.error('Niche is required');
    try {
      setPreview(await fetchBulkPreviewCount(filters));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Preview failed');
    }
  }

  async function runDelete() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, confirm: 'DELETE' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      toast.success(`Deleted ${json.count} leads`);
      setConfirmOpen(false);
      setConfirmText('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Bulk delete leads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-destructive/90">
          Permanent. Related calls, triggers, and activities are removed via cascade
          deletes.
        </p>
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
          statusDefaults={['dead']}
        />
        {preview != null && (
          <p className="text-sm font-medium text-destructive">
            This will permanently delete {preview} leads.
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void runPreview()}>
            Preview count
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!nicheId || preview == null || preview === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Delete leads
          </Button>
        </div>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm bulk delete</AlertDialogTitle>
              <AlertDialogDescription>
                Type DELETE to confirm removal of {preview} leads. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Label>Type DELETE</Label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={loading || confirmText !== 'DELETE'}
                className="bg-destructive text-destructive-foreground"
                onClick={() => void runDelete()}
              >
                Delete forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
