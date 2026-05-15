'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { estimateGenerationCostLocal } from '@/lib/cost/estimator';

type Props = {
  quantity: number;
  onChange: (q: number) => void;
  paidSources: string[];
};

export function QuantitySlider({ quantity, onChange, paidSources }: Props) {
  const est = estimateGenerationCostLocal({ quantity, paidSources });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Quantity</Label>
        <span className="text-sm font-medium">{quantity} leads</span>
      </div>
      <Slider
        min={10}
        max={200}
        step={5}
        value={[quantity]}
        onValueChange={(v) => onChange(v[0] ?? 10)}
      />
      <p className="text-xs text-muted-foreground">
        Rough estimate ~${est.toFixed(2)} (Haiku summaries only)
      </p>
    </div>
  );
}
