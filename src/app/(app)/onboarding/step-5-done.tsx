'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { completeOnboarding } from '@/lib/onboarding/actions';

export function StepDone({ onFinished }: { onFinished: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    const res = await completeOnboarding();
    setBusy(false);
    if (res.ok) {
      onFinished();
      router.push('/generator');
    }
  }

  return (
    <div className="space-y-6 py-2 text-center">
      <p className="text-muted-foreground">
        You&apos;re all set. Generate your first leads from the Generator.
      </p>
      <Button className="w-full" size="lg" disabled={busy} onClick={() => void finish()}>
        Go to Generator
      </Button>
    </div>
  );
}
