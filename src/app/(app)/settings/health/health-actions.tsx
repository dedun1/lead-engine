'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function HealthRunAllButton({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!isAdmin) return null;

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          toast.message('Running health checks…');
          const res = await fetch('/api/health/run-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true }),
          });
          const json = await res.json();
          if (!res.ok) {
            toast.error(json.error ?? 'Failed');
            return;
          }
          const ran = (json.results ?? []).filter((r: { skipped?: boolean }) => !r.skipped);
          const ok = ran.filter((r: { ok: boolean }) => r.ok).length;
          toast.success(`Finished: ${ok}/${ran.length} checks passed`);
          router.refresh();
        })
      }
    >
      {pending ? 'Running…' : 'Run all health checks'}
    </Button>
  );
}
