'use client';

import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { COUNTRY_FLAGS, sectorBadgeClass } from '@/lib/niches/sectors';
import type { NicheRecord } from '@/lib/niches/types';
import { cn } from '@/lib/utils';

export function NicheCard({
  niche,
  onOpen,
  onToggleFavorite,
}: {
  niche: NicheRecord;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-transform hover:-translate-y-0.5"
      onClick={onOpen}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className={cn('text-xs', sectorBadgeClass(niche.parent_sector))}
          >
            {niche.parent_sector ?? 'Other'}
          </Badge>
          <button
            type="button"
            className="rounded p-1 hover:bg-accent"
            aria-label={
              niche.is_favorited ? 'Remove favorite' : 'Add favorite'
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star
              className={cn(
                'h-4 w-4',
                niche.is_favorited
                  ? 'fill-chart-5 text-chart-5'
                  : 'text-muted-foreground',
              )}
            />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold leading-tight">{niche.name}</h3>
          <p className="font-mono text-xs text-muted-foreground">
            {niche.naics_code}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(niche.country_scope ?? []).map((code) => (
            <span key={code} className="text-base" title={code}>
              {COUNTRY_FLAGS[code] ?? code}
            </span>
          ))}
          {niche.is_actively_pitching && (
            <Badge variant="destructive" className="text-[10px]">
              Actively pitching
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
