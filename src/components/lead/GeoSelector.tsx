'use client';

import { useEffect, useState } from 'react';
import { COUNTRIES, getRegionsByCountry, type CountryCode } from '@/lib/geo';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
          <SelectContent>
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
          <SelectContent>
            {regions.map((r) => (
              <SelectItem key={r.code} value={r.code}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>City</Label>
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Houston"
        />
      </div>
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
