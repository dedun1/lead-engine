'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LEAD_STATUSES } from '@/lib/pipeline/types';

type Niche = { id: string; name: string };
type Member = { id: string; display_name: string | null; email: string };

export function BulkFilterFields({
  niches,
  nicheId,
  onNicheId,
  region,
  onRegion,
  statuses,
  onStatuses,
  assignedTo,
  onAssignedTo,
  members,
  statusDefaults,
}: {
  niches: Niche[];
  nicheId: string;
  onNicheId: (v: string) => void;
  region: string;
  onRegion: (v: string) => void;
  statuses: string[];
  onStatuses: (v: string[]) => void;
  assignedTo: string;
  onAssignedTo: (v: string) => void;
  members: Member[];
  statusDefaults?: string[];
}) {
  const toggleStatus = (st: string) => {
    onStatuses(
      statuses.includes(st) ? statuses.filter((s) => s !== st) : [...statuses, st],
    );
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Niche (required)</Label>
        <Select value={nicheId} onValueChange={onNicheId}>
          <SelectTrigger>
            <SelectValue placeholder="Select niche" />
          </SelectTrigger>
          <SelectContent>
            {niches.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Region</Label>
        <Input value={region} onChange={(e) => onRegion(e.target.value)} placeholder="Optional" />
      </div>
      <div className="sm:col-span-2">
        <Label>Status</Label>
        <div className="mt-1 flex flex-wrap gap-1">
          {LEAD_STATUSES.map((st) => (
            <Badge
              key={st}
              variant={
                statuses.includes(st) ||
                (!statuses.length && statusDefaults?.includes(st))
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer"
              onClick={() => toggleStatus(st)}
            >
              {st}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <Label>Current assignee</Label>
        <Select value={assignedTo || 'any'} onValueChange={(v) => onAssignedTo(v === 'any' ? '' : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.display_name ?? m.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
