'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LEAD_STATUSES, type LeadStatus } from '@/lib/pipeline/types';
import { STATUS_LABELS } from '@/lib/pipeline/status';

type Props = {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
  disabled?: boolean;
};

export function LeadStatusChanger({ value, onChange, disabled }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LeadStatus)} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
