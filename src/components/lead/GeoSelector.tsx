'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  COUNTRIES,
  getCitiesByRegion,
  getRegionsByCountry,
  type CountryCode,
} from '@/lib/geo';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CityCombobox } from './CityCombobox';

export type GeoSelection = {
  country: CountryCode;
  region: string;
  city: string;
  postal?: string;
};

type Props = {
  value?: Partial<GeoSelection>;
  onChange: (geo: GeoSelection) => void;
};

export function GeoSelector({ value, onChange }: Props) {
  const [country, setCountry] = useState<CountryCode>(value?.country ?? 'US');
  const [region, setRegion] = useState(value?.region ?? '');
  const [city, setCity] = useState(value?.city ?? '');
  const [postal, setPostal] = useState(value?.postal ?? '');

  const regions = getRegionsByCountry(country);
  const cities = useMemo(
    () => (region ? getCitiesByRegion(country, region) : []),
    [country, region],
  );

  useEffect(() => {
    if (!region && regions[0]) setRegion(regions[0].code);
  }, [country, region, regions]);

  useEffect(() => {
    if (!region || !city) return;
    onChange({
      country,
      region,
      city,
      postal: postal || undefined,
    });
  }, [country, region, city, postal, onChange]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Country</Label>
        <Select
          value={country}
          onValueChange={(v) => {
            setCountry(v as CountryCode);
            setRegion('');
            setCity('');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Region</Label>
        <Select
          value={region}
          onValueChange={(v) => {
            setRegion(v);
            setCity('');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="State / province" />
          </SelectTrigger>
          <SelectContent className="max-h-[400px] p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-1">
                {regions.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.name}
                  </SelectItem>
                ))}
              </div>
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
      <CityCombobox
        cities={cities}
        value={city}
        onChange={setCity}
        disabled={!region}
      />
      <div className="space-y-2">
        <Label>Postal code (optional)</Label>
        <Input
          value={postal}
          onChange={(e) => setPostal(e.target.value)}
          placeholder="77002"
        />
      </div>
    </div>
  );
}
