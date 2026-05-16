'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  date: Date | undefined;
  onDateChange: (d: Date | undefined) => void;
  showTime?: boolean;
  timeValue: string;
  onTimeChange: (t: string) => void;
};

export function OutcomeScheduleFields({
  label,
  date,
  onDateChange,
  showTime,
  timeValue,
  onTimeChange,
}: Props) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={onDateChange} />
        </PopoverContent>
      </Popover>
      {showTime && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Time</Label>
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
