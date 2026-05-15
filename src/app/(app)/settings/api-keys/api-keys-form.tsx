'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { API_KEY_SERVICES } from '@/lib/api-keys/services';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { deleteApiKey, saveApiKey } from './actions';

type SavedKeys = Record<string, string | null>;

function AdminOnlyButton({
  isAdmin,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { isAdmin: boolean }) {
  if (isAdmin) return <Button {...props}>{children}</Button>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button {...props} disabled>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Admin only</TooltipContent>
    </Tooltip>
  );
}

function ServiceRow({
  service,
  label,
  required,
  lastFour,
  isAdmin,
}: {
  service: string;
  label: string;
  required?: boolean;
  lastFour: string | null;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(!lastFour);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    const result = await saveApiKey(service, value);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('API key saved');
    setValue('');
    setEditing(false);
  }

  async function handleDelete() {
    setBusy(true);
    const result = await deleteApiKey(service);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('API key removed');
    setEditing(true);
  }

  async function handleTest() {
    setBusy(true);
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Test failed');
        return;
      }
      toast.success('Key validated');
    } catch {
      toast.error('Test failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 border-b border-border pb-6 last:border-0 last:pb-0">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {lastFour && !editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            •••• {lastFour}
          </span>
          <AdminOnlyButton
            isAdmin={isAdmin}
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setEditing(true)}
          >
            Update
          </AdminOnlyButton>
          <AdminOnlyButton
            isAdmin={isAdmin}
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={handleTest}
          >
            Test
          </AdminOnlyButton>
          <AdminOnlyButton
            isAdmin={isAdmin}
            type="button"
            variant="destructive"
            size="sm"
            disabled={busy}
            onClick={handleDelete}
          >
            Delete
          </AdminOnlyButton>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="password"
            autoComplete="off"
            placeholder="Paste API key"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!isAdmin || busy}
            className="max-w-md"
          />
          <AdminOnlyButton
            isAdmin={isAdmin}
            type="button"
            size="sm"
            disabled={busy || !value.trim()}
            onClick={handleSave}
          >
            Save
          </AdminOnlyButton>
          {lastFour && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setValue('');
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ApiKeysForm({
  isAdmin,
  savedKeys,
}: {
  isAdmin: boolean;
  savedKeys: SavedKeys;
}) {
  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Third-party API Keys</CardTitle>
          <CardDescription>
            Keys are encrypted at rest. At minimum, add Anthropic to enable AI
            features. Other keys are optional paid sources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {API_KEY_SERVICES.map(({ id, label, required }) => (
            <ServiceRow
              key={id}
              service={id}
              label={label}
              required={required}
              lastFour={savedKeys[id] ?? null}
              isAdmin={isAdmin}
            />
          ))}
          {!isAdmin && (
            <p className="text-xs text-muted-foreground">
              You can view saved keys. Only admins can save, test, or delete.
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
