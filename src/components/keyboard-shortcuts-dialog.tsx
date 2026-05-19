'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Row({ keys, desc }: { keys: string; desc: string }) {
  return (
    <tr className="border-b border-border/60">
      <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">{keys}</td>
      <td className="py-2 text-sm text-muted-foreground">{desc}</td>
    </tr>
  );
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press <kbd className="rounded border px-1">?</kbd> anytime to open this panel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="mb-2 font-semibold">Navigation (global)</h3>
            <table className="w-full">
              <tbody>
                <Row keys="G then H" desc="Home — Learning Dashboard" />
                <Row keys="G then P" desc="Pipeline" />
                <Row keys="G then Q" desc="Call Queue" />
                <Row keys="G then N" desc="Niches" />
                <Row keys="G then T" desc="Hot List (triggers)" />
                <Row keys="G then S" desc="Settings" />
              </tbody>
            </table>
          </section>
          <section>
            <h3 className="mb-2 font-semibold">Call Queue</h3>
            <table className="w-full">
              <tbody>
                <Row keys="J / K" desc="Next / previous lead" />
                <Row keys="C or Space" desc="Start call" />
                <Row keys="N" desc="Add note" />
                <Row keys="F" desc="Filter" />
              </tbody>
            </table>
          </section>
          <section>
            <h3 className="mb-2 font-semibold">Anywhere</h3>
            <table className="w-full">
              <tbody>
                <Row keys="Esc" desc="Close dialogs and drawers" />
                <Row keys="?" desc="This help dialog" />
                <Row keys="⌘/Ctrl K" desc="Command palette (coming soon)" />
              </tbody>
            </table>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
