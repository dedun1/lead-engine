'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  deferOnboardingAnthropicKey,
  saveOnboardingAnthropicKey,
  testOnboardingAnthropicKey,
} from '@/lib/onboarding/actions';

export function StepApiKey({
  isAdmin,
  onContinue,
}: {
  isAdmin: boolean;
  onContinue: () => void;
}) {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function testKey() {
    setBusy(true);
    setMessage(null);
    const res = await testOnboardingAnthropicKey(key);
    setBusy(false);
    if (res.ok) {
      setStatus('ok');
      setMessage('Verified');
    } else {
      setStatus('fail');
      setMessage(res.error);
    }
  }

  async function saveAndContinue() {
    if (!isAdmin) {
      onContinue();
      return;
    }
    setBusy(true);
    const res = await saveOnboardingAnthropicKey(key);
    setBusy(false);
    if (!res.ok) {
      setStatus('fail');
      setMessage(res.error);
      return;
    }
    onContinue();
  }

  async function skipLater() {
    await deferOnboardingAnthropicKey();
    onContinue();
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground">
          Ask an admin to add the Anthropic API key in Settings → API Keys.
        </p>
        <Button className="w-full" onClick={onContinue}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-muted-foreground">
        Paste your Anthropic API key. We use Claude Haiku 4.5 only (~$0.001 test ping).
      </p>
      <div className="space-y-2">
        <Label htmlFor="anthropic-key">Anthropic API key</Label>
        <Input
          id="anthropic-key"
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setStatus('idle');
            setMessage(null);
          }}
          placeholder="sk-ant-…"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" disabled={busy || !key.trim()} onClick={() => void testKey()}>
          Test
        </Button>
        {status === 'ok' && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> Verified
          </span>
        )}
        {status === 'fail' && message && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <X className="h-4 w-4" /> {message}
          </span>
        )}
      </div>
      <Button
        className="w-full"
        disabled={busy || status !== 'ok'}
        onClick={() => void saveAndContinue()}
      >
        Continue
      </Button>
      <Button variant="ghost" className="w-full" disabled={busy} onClick={() => void skipLater()}>
        Add later
      </Button>
    </div>
  );
}
