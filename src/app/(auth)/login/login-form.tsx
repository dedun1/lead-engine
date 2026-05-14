'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Magic-link form. Submits to Supabase signInWithOtp; the actual session
// exchange happens at /callback when the user clicks the email link.
export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || pending) return;
    setPending(true);
    try {
      const supabase = createClient();
      // Build absolute callback URL so Supabase can redirect back into this app.
      const callbackUrl = new URL('/callback', window.location.origin);
      if (redirectTo) callbackUrl.searchParams.set('next', redirectTo);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          // shouldCreateUser=false would block first-time admin bootstrap;
          // RLS + invite-only auth in Supabase dashboard enforce membership.
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success('Magic link sent', {
        description: `Check ${email}. Open the link on this device.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send magic link';
      toast.error('Sign in failed', { description: msg });
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center space-y-3">
        <p className="text-sm">
          Sign-in link sent to <strong className="break-all">{email}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          Open the email on this device. Links expire after 1 hour.
        </p>
        <button
          type="button"
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          onClick={() => setSent(false)}
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@twentyfour.app"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending || !email}>
        {pending ? 'Sending magic link…' : 'Send magic link'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No password. Eyad provisions team access via Supabase.
      </p>
    </form>
  );
}
