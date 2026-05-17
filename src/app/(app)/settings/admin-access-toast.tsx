'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AdminAccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('adminRequired') === '1') {
      toast.error('Admin access required');
      const p = new URLSearchParams(searchParams.toString());
      p.delete('adminRequired');
      const q = p.toString();
      router.replace(q ? `/settings?${q}` : '/settings');
    }
  }, [searchParams, router]);

  return null;
}
