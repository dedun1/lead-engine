'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GeoSelector, type GeoSelection } from '@/components/lead/GeoSelector';
import { CostEstimatorModal } from '@/components/lead/CostEstimatorModal';
import { GenerationProgress } from '@/components/lead/GenerationProgress';
import { FiltersPanel } from './filters-panel';
import { QuantitySlider } from './quantity-slider';
import {
  DEFAULT_GENERATION_FILTERS,
  stripGenerationFilters,
  type GenerationFilters,
} from '@/lib/generate/filters';
import { getRegionsByCountry } from '@/lib/geo';

type PitchingNiche = { id: string; name: string };

type Props = {
  pitchingNiches: PitchingNiche[];
};

export function GeneratorClient({ pitchingNiches }: Props) {
  const [nicheId, setNicheId] = useState(pitchingNiches[0]?.id ?? '');
  const [geo, setGeo] = useState<GeoSelection | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [filters, setFilters] = useState<GenerationFilters>({
    ...DEFAULT_GENERATION_FILTERS,
  });
  const [citySize, setCitySize] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [runPayload, setRunPayload] = useState<{
    payload: Parameters<typeof GenerationProgress>[0]['payload'];
    geoLabel: string;
  } | null>(null);

  const niche = pitchingNiches.find((n) => n.id === nicheId);
  const regionName = useMemo(() => {
    if (!geo) return '';
    return (
      getRegionsByCountry(geo.country).find((r) => r.code === geo.region)
        ?.name ?? geo.region
    );
  }, [geo]);

  if (pitchingNiches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Go to{' '}
        <Link href="/niches" className="underline">
          /niches
        </Link>{' '}
        and mark a niche as actively pitching first.
      </p>
    );
  }

  const checkCitySize = async () => {
    if (!geo || !niche) return;
    setCitySize('Checking…');
    const res = await fetch('/api/generate/check-city-size', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nicheKeyword: niche.name,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        postalCode: geo.postal,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const label =
        data.estimated_count >= 200
          ? '200+'
          : `~${data.estimated_count}`;
      setCitySize(`${label} results available`);
    } else {
      setCitySize('Check failed — try again');
    }
  };

  const startRun = (enrichment_sources: string[]) => {
    if (!geo || !niche) return;
    const apiFilters = stripGenerationFilters(filters);
    console.log('[generator] filters sent to API:', apiFilters);
    setRunPayload({
      payload: {
        niche_id: niche.id,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        postalCode: geo.postal,
        quantity,
        filters: apiFilters,
        enrichment_sources,
      },
      geoLabel: `${geo.city}, ${regionName}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Niche</Label>
        <Select value={nicheId} onValueChange={setNicheId}>
          <SelectTrigger>
            <SelectValue placeholder="Select niche" />
          </SelectTrigger>
          <SelectContent>
            {pitchingNiches.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <GeoSelector onChange={setGeo} />

      <FiltersPanel filters={filters} onChange={setFilters} />

      <QuantitySlider
        quantity={quantity}
        onChange={setQuantity}
        paidSources={[]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="space-y-1">
          <Button
            variant="outline"
            disabled={!geo?.city}
            onClick={() => void checkCitySize()}
          >
            Check city size
          </Button>
          {citySize && (
            <p className="text-xs text-muted-foreground">{citySize}</p>
          )}
        </div>
        <Button
          disabled={!geo?.city || !nicheId}
          onClick={() => setModalOpen(true)}
        >
          Estimate cost
        </Button>
      </div>

      {niche && geo && (
        <CostEstimatorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          niche={niche}
          geo={geo}
          quantity={quantity}
          filters={filters as Record<string, unknown>}
          onRun={startRun}
        />
      )}

      {runPayload && (
        <GenerationProgress
          payload={runPayload.payload}
          geoLabel={runPayload.geoLabel}
        />
      )}
    </div>
  );
}
