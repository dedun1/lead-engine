'use client';

import { formatDistanceToNow } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import type { BlocklistRow } from '@/lib/settings/fetch-blocklist';

export function BlocklistTable({
  rows,
  nextCursor,
  isAdmin,
  blockers,
}: {
  rows: BlocklistRow[];
  nextCursor: string | null;
  isAdmin: boolean;
  blockers: { id: string; display_name: string | null }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [unblockFp, setUnblockFp] = useState<string | null>(null);

  const blockedByFilter = searchParams.getAll('blocked_by');

  function setFilter(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((v) => params.append(key, v));
    params.delete('cursor');
    router.push(`/settings/blocklist?${params.toString()}`);
  }

  function toggleBlocker(id: string) {
    const next = blockedByFilter.includes(id)
      ? blockedByFilter.filter((x) => x !== id)
      : [...blockedByFilter, id];
    setFilter('blocked_by', next);
  }

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  async function reviewSelected() {
    startTransition(async () => {
      const res = await fetch('/api/blocklist/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? 'Review failed');
        return;
      }
      toast.success('Marked as reviewed');
      setSelected(new Set());
      router.refresh();
    });
  }

  async function confirmUnblock() {
    if (!unblockFp) return;
    startTransition(async () => {
      const res = await fetch('/api/blocklist/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: unblockFp }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? 'Unblock failed');
        return;
      }
      toast.success('Fingerprint unblocked');
      setUnblockFp(null);
      router.refresh();
    });
  }

  const fpPreview = useMemo(
    () => (fp: string) => (fp.length > 12 ? `${fp.slice(0, 12)}…` : fp),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground">Blocked by:</span>
        {blockers.map((b) => (
          <Button
            key={b.id}
            size="sm"
            variant={blockedByFilter.includes(b.id) ? 'default' : 'outline'}
            onClick={() => toggleBlocker(b.id)}
          >
            {b.display_name ?? b.id.slice(0, 8)}
          </Button>
        ))}
        {isAdmin && (
          <Button
            size="sm"
            className="ml-auto"
            disabled={pending || selected.size === 0}
            onClick={() => void reviewSelected()}
          >
            Review selected ({selected.size})
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No blocked fingerprints. Leads get blocked when marked as wrong_number, DNC, or
          manually via Lead Detail Drawer.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) =>
                      setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())
                    }
                  />
                </TableHead>
              )}
              <TableHead>Fingerprint</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Blocked by</TableHead>
              <TableHead>Blocked at</TableHead>
              <TableHead>Last reviewed</TableHead>
              <TableHead>Last lead</TableHead>
              {isAdmin && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {isAdmin && (
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={(v) => {
                        const next = new Set(selected);
                        if (v) next.add(row.id);
                        else next.delete(row.id);
                        setSelected(next);
                      }}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Popover>
                    <PopoverTrigger className="font-mono text-xs underline">
                      {fpPreview(row.fingerprint)}
                    </PopoverTrigger>
                    <PopoverContent className="font-mono text-xs break-all">
                      {row.fingerprint}
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell className="max-w-[180px] truncate">{row.reason ?? '—'}</TableCell>
                <TableCell>{row.blocker_name ?? '—'}</TableCell>
                <TableCell>
                  {row.blocked_at ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-sm underline-offset-2 hover:underline">
                          {formatDistanceToNow(new Date(row.blocked_at), { addSuffix: true })}
                        </TooltipTrigger>
                        <TooltipContent>
                          {new Date(row.blocked_at).toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {row.last_reviewed_at
                    ? formatDistanceToNow(new Date(row.last_reviewed_at), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                <TableCell className="text-sm">{row.lead_label ?? '—'}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => setUnblockFp(row.fingerprint)}
                    >
                      Unblock
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {nextCursor && (
        <Button
          variant="outline"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('cursor', nextCursor);
            router.push(`/settings/blocklist?${params.toString()}`);
          }}
        >
          Load more
        </Button>
      )}

      <AlertDialog open={!!unblockFp} onOpenChange={(o) => !o && setUnblockFp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock fingerprint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unblock this fingerprint. Future leads with this fingerprint will
              be allowed back into the pipeline. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmUnblock()}>
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
