'use client';

import { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sectorBadgeClass } from '@/lib/niches/sectors';
import type { NicheRecord } from '@/lib/niches/types';
import { cn } from '@/lib/utils';
import { IntelligenceTab } from './intelligence-tab';

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function NicheDetailDrawer({
  niche,
  open,
  isAdmin,
  onClose,
  onToggleFavorite,
  onTogglePitching,
}: {
  niche: NicheRecord | null;
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onTogglePitching: () => void;
}) {
  const countries = niche?.country_scope ?? ['US'];
  const [country, setCountry] = useState(countries[0] ?? 'US');

  useEffect(() => {
    if (niche?.country_scope?.[0]) {
      setCountry(niche.country_scope[0]);
    }
  }, [niche?.id, niche?.country_scope]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-[480px]">
        {niche && (
          <>
            <SheetHeader className="space-y-3 text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <SheetTitle className="text-xl">{niche.name}</SheetTitle>
                  <p className="font-mono text-xs text-muted-foreground">
                    {niche.naics_code}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      sectorBadgeClass(niche.parent_sector),
                    )}
                  >
                    {niche.parent_sector ?? 'Other'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-accent"
                    onClick={onToggleFavorite}
                  >
                    <Star
                      className={cn(
                        'h-5 w-5',
                        niche.is_favorited
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground',
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-accent"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-4 flex-1">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="intelligence" className="flex-1">
                  Intelligence
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4 space-y-0">
                <OverviewRow
                  label="Countries"
                  value={(niche.country_scope ?? []).join(', ') || '—'}
                />
                <OverviewRow
                  label="Weather sensitive"
                  value={niche.weather_sensitive ? 'Yes' : 'No'}
                />
                <OverviewRow
                  label="On shortlist"
                  value={niche.is_shortlist ? 'Yes' : 'No'}
                />
                <OverviewRow
                  label="Favorited"
                  value={niche.is_favorited ? 'Yes' : 'No'}
                />
                <OverviewRow
                  label="Actively pitching"
                  value={niche.is_actively_pitching ? 'Yes' : 'No'}
                />
                <OverviewRow
                  label="Sector"
                  value={niche.parent_sector ?? '—'}
                />
                <OverviewRow
                  label="Created"
                  value={
                    niche.created_at
                      ? new Date(niche.created_at).toLocaleDateString()
                      : '—'
                  }
                />
              </TabsContent>
              <TabsContent value="intelligence" className="mt-4">
                <IntelligenceTab
                  nicheId={niche.id}
                  country={country}
                  isAdmin={isAdmin}
                />
              </TabsContent>
            </Tabs>

            <div className="mt-auto space-y-4 border-t border-border pt-4">
              <div className="space-y-2">
                <Label>Intelligence country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pitching-switch">
                  Mark as actively pitching
                </Label>
                <Switch
                  id="pitching-switch"
                  checked={niche.is_actively_pitching ?? false}
                  disabled={!isAdmin}
                  onCheckedChange={() => onTogglePitching()}
                />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
