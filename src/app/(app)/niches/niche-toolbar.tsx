'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const ALL_COUNTRIES = ['US', 'CA', 'UK', 'AU'] as const;

export type NicheViewMode = 'shortlist' | 'all';

export function NicheToolbar({
  viewMode,
  search,
  countries,
  onViewModeChange,
  onSearchChange,
  onCountriesChange,
}: {
  viewMode: NicheViewMode;
  search: string;
  countries: string[];
  onViewModeChange: (mode: NicheViewMode) => void;
  onSearchChange: (value: string) => void;
  onCountriesChange: (codes: string[]) => void;
}) {
  const [draft, setDraft] = useState(search);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(draft), 300);
    return () => clearTimeout(timer);
  }, [draft, onSearchChange]);

  function toggleCountry(code: string) {
    if (countries.includes(code)) {
      const next = countries.filter((c) => c !== code);
      onCountriesChange(next.length ? next : [...ALL_COUNTRIES]);
    } else {
      onCountriesChange([...countries, code]);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={viewMode}
        onValueChange={(v) => onViewModeChange(v as NicheViewMode)}
      >
        <TabsList>
          <TabsTrigger value="shortlist">Shortlist</TabsTrigger>
          <TabsTrigger value="all">All niches</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
        <Input
          placeholder="Search name or NAICS…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="max-w-xs"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[140px] justify-between">
              Countries ({countries.length})
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="end">
            <Command>
              <CommandList>
                <CommandEmpty>No countries</CommandEmpty>
                <CommandGroup>
                  {ALL_COUNTRIES.map((code) => (
                    <CommandItem
                      key={code}
                      onSelect={() => toggleCountry(code)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          countries.includes(code) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {code}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
