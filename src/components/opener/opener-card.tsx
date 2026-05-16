'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { OpenerVariantRow } from '@/lib/ai/opener-types';
import { updateOpenerText } from '@/lib/opener/actions';

type Props = {
  variant: OpenerVariantRow;
  isAdmin: boolean;
  onRegenerate: () => void;
  onUpdated: () => void;
  compact?: boolean;
};

export function OpenerCard({
  variant,
  isAdmin,
  onRegenerate,
  onUpdated,
  compact,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(variant.opener_text);
  const [saving, setSaving] = useState(false);

  const rate =
    variant.predicted_open_rate != null
      ? Math.round(variant.predicted_open_rate * 100)
      : null;

  const copy = () => {
    void navigator.clipboard.writeText(variant.opener_text);
    toast.success('Copied opener');
  };

  const saveEdit = async () => {
    setSaving(true);
    const res = await updateOpenerText(variant.id, draft.trim());
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success('Opener saved');
    setEditing(false);
    onUpdated();
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      {editing ? (
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
      ) : (
        <p
          className={
            compact
              ? 'text-lg font-medium leading-relaxed'
              : 'text-base leading-relaxed'
          }
        >
          {variant.opener_text}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {variant.hook_type && (
          <Badge variant="secondary">Hook: {variant.hook_type}</Badge>
        )}
        {rate != null && <span>Predicted open rate: {rate}%</span>}
        <span>Used {variant.times_used ?? 0} times</span>
        <span>Meetings: {variant.meetings_set ?? 0}</span>
        {variant.is_edited && <span className="text-amber-600">Edited</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          <Copy className="mr-1 h-3 w-3" />
          Copy
        </Button>
        {!editing && (
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
        {editing && (
          <>
            <Button type="button" size="sm" disabled={saving} onClick={() => void saveEdit()}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(variant.opener_text);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </>
        )}
        {isAdmin && (
          <Button type="button" size="sm" variant="secondary" onClick={onRegenerate}>
            Regenerate
          </Button>
        )}
      </div>
    </div>
  );
}
