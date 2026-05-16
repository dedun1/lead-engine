'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

type Props = {
  cities: string[];
  value: string;
  onChange: (city: string) => void;
  disabled?: boolean;
};

export function CityCombobox({ cities, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, search]);

  const showCustom =
    search.trim().length > 0 && (filtered.length === 0 || filtered.length < 3);

  if (cities.length === 0) {
    return (
      <div className="space-y-2">
        <Label>City</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="City name"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>City</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {value || 'Select city...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search cities..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <ScrollArea className="max-h-[300px]">
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  {filtered.map((city) => (
                    <CommandItem
                      key={city}
                      value={city}
                      onSelect={() => {
                        onChange(city);
                        setOpen(false);
                        setSearch('');
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === city ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {city}
                    </CommandItem>
                  ))}
                  {showCustom && (
                    <CommandItem
                      value={`custom-${search}`}
                      onSelect={() => {
                        onChange(search.trim());
                        setOpen(false);
                        setSearch('');
                      }}
                    >
                      Use custom city: &apos;{search.trim()}&apos;
                    </CommandItem>
                  )}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
