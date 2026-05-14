'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (pending) return;
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/login');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      toast.error('Sign out failed', { description: msg });
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        'flex h-10 w-full items-center rounded-md px-3 text-sm text-muted-foreground',
        'transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50',
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span className="ml-3 whitespace-nowrap opacity-0 transition-opacity group-hover/sidebar:opacity-100">
        {pending ? 'Signing out…' : 'Sign out'}
      </span>
    </button>
  );
}
