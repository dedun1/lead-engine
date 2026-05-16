'use client';

import { formatDistanceToNow } from 'date-fns';
import { Check, Mail, Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatForDisplay, formatForTelLink } from '@/lib/phone';
import type { PipelineLeadRow } from '@/lib/pipeline/types';
import { getHoursDot, HOURS_DOT_CLASS } from '@/lib/pipeline/hours-indicator';
import { parseWeeklyHours } from '@/lib/pipeline/lead-utils';
import { formatLastActivitySummary } from '@/lib/pipeline/activity-text';
import { LeadStatusBadge } from './lead-status-badge';
import { LeadActionsMenu } from './lead-actions-menu';
type Props = {
  leads: PipelineLeadRow[];
  selected: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onOpenLead: (id: string) => void;
  onAssign: (id: string) => void;
  onBlock: (id: string) => void;
  sort: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
};

function SortHead({
  label,
  col,
  sort,
  sortDir,
  onSort,
}: {
  label: string;
  col: string;
  sort: string;
  sortDir: 'asc' | 'desc';
  onSort: (c: string) => void;
}) {
  const active = sort === col;
  return (
    <button
      type="button"
      className="font-medium hover:underline"
      onClick={() => onSort(col)}
    >
      {label}
      {active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </button>
  );
}

export function PipelineTable({
  leads,
  selected,
  onSelect,
  onSelectAll,
  onOpenLead,
  onAssign,
  onBlock,
  sort,
  sortDir,
  onSort,
}: Props) {
  const allSelected = leads.length > 0 && leads.every((l) => selected.has(l.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(v) => onSelectAll(!!v)}
            />
          </TableHead>
          <TableHead>
            <SortHead label="Business" col="business_name" sort={sort} sortDir={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead>
            <SortHead label="Status" col="status" sort={sort} sortDir={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Enriched</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>
            <SortHead label="Rating" col="rating" sort={sort} sortDir={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead>Hours</TableHead>
          <TableHead>
            <SortHead label="Last activity" col="last_activity_at" sort={sort} sortDir={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => {
          const hours = parseWeeklyHours(lead.business_hours);
          const dot = getHoursDot(hours, lead.timezone);
          return (
            <TableRow
              key={lead.id}
              className="cursor-pointer"
              onClick={() => onOpenLead(lead.id)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected.has(lead.id)}
                  onCheckedChange={(v) => onSelect(lead.id, !!v)}
                />
              </TableCell>
              <TableCell className="font-medium">
                <button
                  type="button"
                  className="text-left text-primary underline-offset-2 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLead(lead.id);
                  }}
                >
                  {lead.business_name}
                </button>
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell>
                {lead.business_phone ? (
                  <a
                    href={formatForTelLink(lead.business_phone)}
                    className="underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formatForDisplay(lead.business_phone)}
                  </a>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-sm">
                {lead.owner_name ? (
                  <span className="flex items-center gap-1">
                    {lead.owner_name}
                    {lead.owner_email_status === 'verified' && (
                      <Mail className="h-3 w-3 text-green-600" aria-label="Email verified" />
                    )}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {lead.enriched_at ? (
                  <span className="flex items-center gap-1">
                    {(lead.owner_name || lead.owner_email) && (
                      <Check className="h-3 w-3 text-green-600" />
                    )}
                    {formatDistanceToNow(new Date(lead.enriched_at), { addSuffix: true })}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {[lead.city, lead.region].filter(Boolean).join(', ') || '—'}
              </TableCell>
              <TableCell>
                {lead.google_rating != null ? (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
                    {lead.google_rating}
                    <span className="text-muted-foreground">
                      ({lead.google_review_count ?? 0})
                    </span>
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${HOURS_DOT_CLASS[dot]}`}
                  title={dot}
                />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {lead.last_activity_at
                  ? `${formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true })} — ${formatLastActivitySummary(lead.last_activity_type)}`
                  : '—'}
              </TableCell>
              <TableCell className="text-sm">
                {lead.assignee_name ?? '—'}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <LeadActionsMenu
                  onOpen={() => onOpenLead(lead.id)}
                  onAssign={() => onAssign(lead.id)}
                  onBlock={() => onBlock(lead.id)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
