'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ACTIVITY_TYPE_CHIPS, type ActivityChipId } from '@/lib/history/types';

type Niche = { id: string; name: string };

export function HistoryFilterSearch({
  types,
  searchDraft,
  nicheValue,
  niches,
  onSearchChange,
  onToggleType,
  onNicheChange,
}: {
  types: string[];
  searchDraft: string;
  nicheValue: string;
  niches: Niche[];
  onSearchChange: (v: string) => void;
  onToggleType: (id: ActivityChipId) => void;
  onNicheChange: (nicheId: string) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-1">
        {ACTIVITY_TYPE_CHIPS.map((c) => (
          <Badge
            key={c.id}
            variant={types.length === 0 || types.includes(c.id) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onToggleType(c.id)}
          >
            {c.label}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search business name…"
          className="max-w-xs"
          value={searchDraft}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select value={nicheValue} onValueChange={onNicheChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Niche" />
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
    </>
  );
}
