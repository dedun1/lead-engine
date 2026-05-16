'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { DateRangePeriod } from '@/lib/dashboard/types';

const PERIODS: { value: DateRangePeriod; label: string }[] = [
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'last_90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom' },
];

export function DateRangeSelector({ period }: { period: DateRangePeriod }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setPeriod(next: DateRangePeriod) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', next);
    router.push(`/dashboard?${params.toString()}`);
  }

  function setCustom(field: 'from' | 'to', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', 'custom');
    params.set(field, value);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={period} onValueChange={(v) => setPeriod(v as DateRangePeriod)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {period === 'custom' && (
        <>
          <Input
            type="date"
            className="w-[150px]"
            defaultValue={searchParams.get('from') ?? ''}
            onChange={(e) => setCustom('from', e.target.value)}
          />
          <Input
            type="date"
            className="w-[150px]"
            defaultValue={searchParams.get('to') ?? ''}
            onChange={(e) => setCustom('to', e.target.value)}
          />
        </>
      )}
    </div>
  );
}
