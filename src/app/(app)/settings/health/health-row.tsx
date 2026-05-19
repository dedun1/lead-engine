'use client';

import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { hasHealthCheck } from '@/lib/health/source-check-registry';
import { iconForHealthSource } from '@/lib/health/source-icons';
import type { ScraperHealthRow } from '@/lib/health/fetch-sources';
import {
  STATUS_BADGE,
  displayHealthStatus,
} from '@/lib/settings/health-status';
import { TableCell, TableRow } from '@/components/ui/table';

export function HealthRow({
  row,
  isAdmin,
}: {
  row: ScraperHealthRow;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const source = row.source ?? 'unknown';
  const Icon = iconForHealthSource(source);
  const status = displayHealthStatus(row);
  const canCheck = hasHealthCheck(source);
  const lastAt = row.last_check_at ? new Date(row.last_check_at) : null;
  const err = row.last_error ?? '';
  const errShort = err.length > 200 ? `${err.slice(0, 200)}…` : err;

  async function runCheck() {
    startTransition(async () => {
      const res = await fetch('/api/health/run-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      const json = await res.json();
      if (!res.ok) toast.error(json.error ?? 'Check failed');
      else toast.success(`Health check finished for ${source}`);
      router.refresh();
    });
  }

  async function reEnable() {
    startTransition(async () => {
      const res = await fetch('/api/health/re-enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? 'Re-enable failed');
        return;
      }
      toast.success(`${source} re-enabled`);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {source}
        </span>
      </TableCell>
      <TableCell>
        <Badge className={STATUS_BADGE[status]}>{status}</Badge>
      </TableCell>
      <TableCell>
        {lastAt ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="text-sm underline-offset-2 hover:underline">
                {formatDistanceToNow(lastAt, { addSuffix: true })}
              </TooltipTrigger>
              <TooltipContent>{lastAt.toLocaleString()}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell className={row.consecutive_failures && row.consecutive_failures >= 3 ? 'text-destructive font-medium' : ''}>
        {row.consecutive_failures ?? 0}
      </TableCell>
      <TableCell className="max-w-[200px]">
        {err ? (
          <Popover>
            <PopoverTrigger className="text-left text-xs text-muted-foreground underline">
              {errShort || 'View error'}
            </PopoverTrigger>
            <PopoverContent className="max-h-64 max-w-md overflow-auto text-xs whitespace-pre-wrap">
              {err}
            </PopoverContent>
          </Popover>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">No recent activity log</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending || !canCheck}
                        onClick={() => void runCheck()}
                      >
                        Run check
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canCheck && (
                    <TooltipContent>
                      Health check not implemented for this source
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              {row.is_disabled && (
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => void reEnable()}>
                  Re-enable
                </Button>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Admin access required</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
