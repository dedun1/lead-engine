'use client';

import { Button } from '@/components/ui/button';

export function StepWelcome({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-6 py-2">
      <p className="text-muted-foreground">
        Welcome to Lead Engine. Let&apos;s set up your account in 4 quick steps.
      </p>
      <Button className="w-full" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}
