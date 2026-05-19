'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { OpenerPerformanceRow } from '@/lib/dashboard/types';
import { conversionColor, formatPct } from './format';
import {
  OpenerDetailDrawer,
  type OpenerCallDetail,
} from './opener-detail-drawer';

type NicheOption = { id: string; name: string };

export function DashboardOpenerPerformance({
  rows,
  niches,
  callsByVariant,
}: {
  rows: OpenerPerformanceRow[];
  niches: NicheOption[];
  callsByVariant: Record<string, OpenerCallDetail[]>;
}) {
  const [filter, setFilter] = useState<'all' | 'niche' | 'personalized'>('all');
  const [nicheId, setNicheId] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<OpenerPerformanceRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === 'niche') list = list.filter((r) => !r.is_personalized);
    if (filter === 'personalized') list = list.filter((r) => r.is_personalized);
    if (nicheId !== 'all') list = list.filter((r) => r.niche_id === nicheId);
    if (!showAll) list = list.filter((r) => r.times_used >= 5);
    return list;
  }, [rows, filter, nicheId, showAll]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opener variants — what&apos;s working</CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          {(['all', 'niche', 'personalized'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'niche' ? 'Niche-baseline only' : 'Personalized only'}
            </Button>
          ))}
          <Select value={nicheId} onValueChange={setNicheId}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="By niche" />
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
          <Button size="sm" variant="ghost" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Hide low sample' : 'Show all'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Hook</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Niche</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Conv.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No opener data for this period — log calls with an opener variant to populate this table.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((row, i) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => {
                  setSelected(row);
                  setDrawerOpen(true);
                }}
              >
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  {row.hook_type ? (
                    <Badge variant="outline">{row.hook_type}</Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block">
                          {row.opener_text.slice(0, 60)}
                          {row.opener_text.length > 60 ? '…' : ''}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        {row.opener_text}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  {row.is_personalized
                    ? `Personalized: ${row.business_name ?? 'lead'}`
                    : row.niche_name ?? '—'}
                </TableCell>
                <TableCell>{row.times_used}</TableCell>
                <TableCell className={conversionColor(row.conversion_rate)}>
                  {formatPct(row.conversion_rate)}
                  {row.times_used < 5 && (
                    <span className="block text-xs text-muted-foreground">
                      Need more data
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <OpenerDetailDrawer
        row={selected}
        calls={selected ? callsByVariant[selected.id] ?? [] : []}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </Card>
  );
}
