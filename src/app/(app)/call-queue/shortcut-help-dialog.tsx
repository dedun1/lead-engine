'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SHORTCUTS = [
  { keys: 'J / ↓', action: 'Next lead' },
  { keys: 'K / ↑', action: 'Previous lead' },
  { keys: 'C / Space', action: 'Call Now' },
  { keys: 'N', action: 'Mark dead & skip' },
  { keys: 'F', action: 'Focus quick notes' },
  { keys: '?', action: 'This help' },
  { keys: 'Esc', action: 'Exit notes field' },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShortcutHelpDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Call queue shortcuts</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex justify-between gap-4">
              <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">
                {s.keys}
              </kbd>
              <span className="text-muted-foreground">{s.action}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
