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
import { Checkbox } from '@/components/ui/checkbox';
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
import type { DedupeGroup } from '@/lib/admin/dedupe';

type Niche = { id: string; name: string };

export function BulkDedupe({ niches }: { niches: Niche[] }) {
  const [nicheId, setNicheId] = useState('');
  const [groups, setGroups] = useState<DedupeGroup[]>([]);
  const [primaryByGroup, setPrimaryByGroup] = useState<Record<string, string>>({});
  const [understood, setUnderstood] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<{ primary: string; dups: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bulk/dedupe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', niche_id: nicheId || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Scan failed');
      setGroups(json.groups ?? []);
      toast.message(`Found ${json.groups?.length ?? 0} duplicate groups`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  }

  function openMerge(group: DedupeGroup) {
    const key = `${group.kind}:${group.key}`;
    const primary = primaryByGroup[key] ?? group.leads[0]?.id;
    if (!primary) return;
    const dups = group.leads.map((l) => l.id).filter((id) => id !== primary);
    setPending({ primary, dups });
    setUnderstood(false);
    setConfirmOpen(true);
  }

  async function runMerge() {
    if (!pending) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bulk/dedupe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'merge',
          primary_id: pending.primary,
          duplicate_ids: pending.dups,
          understood: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Merge failed');
      toast.success(`Merged ${json.merged} duplicates`);
      setConfirmOpen(false);
      void scan();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Merge failed');
    } finally {
      setLoading(false);
    }
  }

  async function blockGroup(group: DedupeGroup) {
    const fps = group.leads.map((l) => l.fingerprint);
    const res = await fetch('/api/admin/bulk/dedupe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'block', fingerprints: fps }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error ?? 'Block failed');
    toast.success(`Blocked ${json.blocked} fingerprints`);
  }

  return (
    <Card className="border-amber-500/50">
      <CardHeader>
        <CardTitle className="text-base">Bulk dedupe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Niche filter (optional)</Label>
          <Select value={nicheId || 'all'} onValueChange={(v) => setNicheId(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All niches</SelectItem>
              {niches.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" disabled={loading} onClick={() => void scan()}>
          Scan for duplicates
        </Button>
        {groups.map((g) => {
          const gkey = `${g.kind}:${g.key}`;
          return (
            <div key={gkey} className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {g.kind}: {g.key} ({g.leads.length} leads)
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {g.leads.map((l) => (
                  <li key={l.id}>
                    {l.business_name} — {l.fingerprint.slice(0, 8)}… last call:{' '}
                    {l.last_called_at ?? 'never'}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                <Select
                  value={primaryByGroup[gkey] ?? g.leads[0]?.id}
                  onValueChange={(v) =>
                    setPrimaryByGroup((p) => ({ ...p, [gkey]: v }))
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Primary lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {g.leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => openMerge(g)}>
                  Merge into primary
                </Button>
                <Button size="sm" variant="outline" onClick={() => void blockGroup(g)}>
                  Block all
                </Button>
              </div>
            </div>
          );
        })}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm merge</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete {pending?.dups.length ?? 0} duplicate leads and move
                their history to the primary lead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={understood} onCheckedChange={(v) => setUnderstood(v === true)} />
              I understand this will delete duplicate leads and merge their history
            </label>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={!understood || loading}
                onClick={() => void runMerge()}
              >
                Merge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
