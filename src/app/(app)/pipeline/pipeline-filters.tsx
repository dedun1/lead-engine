'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LEAD_STATUSES, type LeadStatus, type PipelineFilters, type PitchingNiche } from '@/lib/pipeline/types';
import { STATUS_LABELS } from '@/lib/pipeline/status';
import { filtersToSearchParams } from '@/lib/pipeline/parse-filters';
import { getRegionsByCountry } from '@/lib/geo';

type Props = {
  filters: PipelineFilters;
  niches: PitchingNiche[];
  onFiltersChange: (f: PipelineFilters) => void;
};

export function PipelineFiltersBar({ filters, niches, onFiltersChange }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.search ?? '');
  const regions = filters.country ? getRegionsByCountry(filters.country) : [];

  const push = useCallback(
    (next: PipelineFilters) => {
      onFiltersChange(next);
      const qs = filtersToSearchParams(next).toString();
      router.replace(qs ? `/pipeline?${qs}` : '/pipeline', { scroll: false });
    },
    [onFiltersChange, router],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== (filters.search ?? '')) {
        push({ ...filters, search: search || undefined, cursor: undefined });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, filters, push]);

  const toggleStatus = (s: LeadStatus) => {
    const current = filters.statuses ?? [];
    const next = current.includes(s)
      ? current.filter((x) => x !== s)
      : [...current, s];
    push({
      ...filters,
      statuses: next.length ? next : undefined,
      cursor: undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px] space-y-1">
          <Label className="text-xs">Niche</Label>
          <Select
            value={filters.nicheId ?? 'all'}
            onValueChange={(v) =>
              push({
                ...filters,
                nicheId: v === 'all' ? undefined : v,
                cursor: undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Actively pitching" />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              <SelectItem value="all">All actively pitching</SelectItem>
              {niches.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[100px] space-y-1">
          <Label className="text-xs">Country</Label>
          <Select
            value={filters.country ?? 'any'}
            onValueChange={(v) =>
              push({
                ...filters,
                country: v === 'any' ? undefined : v,
                region: undefined,
                city: undefined,
                cursor: undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="US">US</SelectItem>
              <SelectItem value="CA">CA</SelectItem>
              <SelectItem value="UK">UK</SelectItem>
              <SelectItem value="AU">AU</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {regions.length > 0 && (
          <div className="min-w-[140px] space-y-1">
            <Label className="text-xs">Region</Label>
            <Select
              value={filters.region ?? 'any'}
              onValueChange={(v) =>
                push({
                  ...filters,
                  region: v === 'any' ? undefined : v,
                  cursor: undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[400px] p-0">
                <ScrollArea className="h-[280px]">
                  <SelectItem value="any">Any</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.name}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="min-w-[120px] space-y-1">
          <Label className="text-xs">Date</Label>
          <Select
            value={filters.dateRange ?? 'all'}
            onValueChange={(v) =>
              push({
                ...filters,
                dateRange: v as PipelineFilters['dateRange'],
                cursor: undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-1">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Business name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {LEAD_STATUSES.map((s) => {
          const active = filters.statuses?.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-primary bg-primary/10' : ''}`}
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
