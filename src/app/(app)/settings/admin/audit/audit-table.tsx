'use client';

import { Fragment, useState } from 'react';
import { loadMoreAuditAction } from './actions';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AUDIT_TYPE_LABELS } from '@/lib/admin/audit';
import type { AuditRow } from '@/lib/admin/fetch-audit';

export function AuditTable({
  initialRows,
  initialCursor,
}: {
  initialRows: AuditRow[];
  initialCursor: string | null;
}) {
  const [rows, setRows] = useState(initialRows);
  const [cursor, setCursor] = useState(initialCursor);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    const p = new URLSearchParams(window.location.search);
    const result = await loadMoreAuditAction({
      start: p.get('start') ?? undefined,
      end: p.get('end') ?? undefined,
      actor_ids: p.getAll('actors'),
      activity_types: p.get('types')?.split(',').filter(Boolean),
      cursor,
    });
    setRows((prev) => [...prev, ...result.rows]);
    setCursor(result.nextCursor);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3">When</th>
              <th className="p-3">Who</th>
              <th className="p-3">What</th>
              <th className="p-3">Lead</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr
                  className="border-b cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <td className="p-3 whitespace-nowrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {formatDistanceToNow(new Date(r.created_at), {
                            addSuffix: true,
                          })}
                        </TooltipTrigger>
                        <TooltipContent>
                          {new Date(r.created_at).toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="p-3">{r.actor_name ?? 'System'}</td>
                  <td className="p-3">
                    <Badge variant="secondary">
                      {AUDIT_TYPE_LABELS[r.activity_type ?? ''] ??
                        r.activity_type}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {r.business_name
                      ? `${r.business_name}${r.city ? ` · ${r.city}` : ''}`
                      : '—'}
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr className="border-b bg-muted/20">
                    <td colSpan={4} className="p-3">
                      <pre className="max-h-48 overflow-auto text-xs">
                        {JSON.stringify(r.payload, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {cursor && (
        <Button variant="outline" disabled={loading} onClick={() => void loadMore()}>
          {loading ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  );
}
