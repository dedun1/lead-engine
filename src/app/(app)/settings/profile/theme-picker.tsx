'use client';

import { useTheme } from 'next-themes';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const OPTIONS = [
  {
    id: 'system',
    label: 'System',
    bg: 'bg-gradient-to-br from-[#FFFFFF] to-[#08090A]',
    primary: 'from-[#635BFF] to-[#5E6AD2]',
  },
  {
    id: 'light',
    label: 'Light',
    bg: 'bg-[#FFFFFF]',
    primary: 'bg-[#635BFF]',
  },
  {
    id: 'dark',
    label: 'Dark',
    bg: 'bg-[#08090A]',
    primary: 'bg-[#5E6AD2]',
  },
  {
    id: 'sepia',
    label: 'Sepia',
    bg: 'bg-[#F4ECD8]',
    primary: 'bg-[#C44536]',
  },
] as const;

export function ThemePicker() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const active = theme ?? 'system';

  return (
    <div className="space-y-3">
      <Label>Theme</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
              active === opt.id
                ? 'border-primary bg-accent'
                : 'border-border hover:bg-muted',
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border',
                opt.bg,
              )}
            >
              <span className={cn('mt-auto h-2 w-full', opt.primary)} />
            </span>
            <span>
              <span className="block text-sm font-medium">{opt.label}</span>
              {opt.id === 'system' && resolvedTheme && (
                <span className="text-xs text-muted-foreground">
                  Currently {resolvedTheme}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Changes apply instantly. Preference is saved for your next visit.
      </p>
    </div>
  );
}

