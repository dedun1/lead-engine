'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';
import {
  countAppliedFilters,
  type GenerationFilters,
} from '@/lib/generate/filters';

type Props = {
  filters: GenerationFilters;
  onChange: (f: GenerationFilters) => void;
};

export function FiltersPanel({ filters, onChange }: Props) {
  const set = (patch: Partial<GenerationFilters>) =>
    onChange({ ...filters, ...patch });

  const applied = countAppliedFilters(filters);
  const ratingActive =
    (filters.rating_min != null && filters.rating_min > 0) ||
    (filters.rating_max != null && filters.rating_max < 5);

  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
        <span className="flex items-center gap-2">
          Filters
          {applied > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {applied} applied
            </Badge>
          )}
        </span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Has website</Label>
          <select
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={filters.has_website ?? 'any'}
            onChange={(e) =>
              set({
                has_website: e.target.value as GenerationFilters['has_website'],
              })
            }
          >
            <option value="any">Any</option>
            <option value="required">Required</option>
            <option value="not_allowed">Not allowed</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Currently open</Label>
          <select
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={filters.currently_open ?? 'any'}
            onChange={(e) =>
              set({
                currently_open: e.target
                  .value as GenerationFilters['currently_open'],
              })
            }
          >
            <option value="any">Any</option>
            <option value="open_now">Open now</option>
            <option value="opens_within_2h">Opens within 2h</option>
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Google rating</Label>
          {ratingActive ? (
            <>
              <p className="text-xs text-muted-foreground">
                {filters.rating_min ?? 0} – {filters.rating_max ?? 5} stars
              </p>
              <Slider
                min={0}
                max={5}
                step={0.5}
                value={[filters.rating_min ?? 0, filters.rating_max ?? 5]}
                onValueChange={([min, max]) =>
                  set({ rating_min: min, rating_max: max })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() =>
                  set({ rating_min: undefined, rating_max: undefined })
                }
              >
                Clear rating filter
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Any rating (no filter).{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => set({ rating_min: 1, rating_max: 5 })}
              >
                Set range
              </button>
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Min reviews</Label>
          <Input
            type="number"
            placeholder="Any"
            value={filters.review_count_min ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              set({
                review_count_min:
                  raw === '' || Number.isNaN(Number(raw))
                    ? undefined
                    : Number(raw),
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Max reviews</Label>
          <Input
            type="number"
            placeholder="Any"
            value={filters.review_count_max ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              set({
                review_count_max:
                  raw === '' || Number.isNaN(Number(raw))
                    ? undefined
                    : Number(raw),
              });
            }}
          />
        </div>
        <div className="flex items-center gap-2 opacity-50 sm:col-span-2">
          <Switch disabled />
          <Label>Employee count (paid enrichment — coming soon)</Label>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
