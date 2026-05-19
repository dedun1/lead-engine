'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saveOnboardingProfile } from '@/lib/onboarding/actions';
import type { OnboardingContext } from '@/lib/onboarding/state';

export function StepProfile({
  ctx,
  onContinue,
}: {
  ctx: OnboardingContext;
  onContinue: () => void;
}) {
  const [name, setName] = useState(ctx.displayName ?? ctx.email.split('@')[0] ?? '');
  const [role, setRole] = useState<'admin' | 'member'>(
    ctx.role === 'admin' ? 'admin' : 'member',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstUser = ctx.showNicheStep;

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await saveOnboardingProfile({
      display_name: name,
      role: isFirstUser ? 'admin' : role,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onContinue();
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {isFirstUser ? (
        <p className="text-sm text-muted-foreground rounded-md border p-3 bg-muted/30">
          You&apos;re the first team member — you&apos;ll be assigned{' '}
          <strong>admin</strong> automatically.
        </p>
      ) : ctx.isAdmin ? (
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'member')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Your role: member</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" disabled={busy || !name.trim()} onClick={() => void submit()}>
        Continue
      </Button>
    </div>
  );
}
