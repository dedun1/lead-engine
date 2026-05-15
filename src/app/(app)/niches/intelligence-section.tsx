'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SectionTitle({ children }: { children: string }) {
  return <h4 className="text-sm font-medium">{children}</h4>;
}

export function EditableTextarea({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== value && onSave(draft)}
        rows={3}
      />
    </div>
  );
}

export function EditableInput({
  label,
  value,
  type = 'text',
  onSave,
}: {
  label: string;
  value: string;
  type?: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== value && onSave(draft)}
      />
    </div>
  );
}

export function EditableStringList({
  label,
  items,
  onSave,
}: {
  label: string;
  items: string[];
  onSave: (items: string[]) => void;
}) {
  const [list, setList] = useState(items);
  useEffect(() => setList(items), [items]);

  function commit(next: string[]) {
    setList(next);
    onSave(next);
  }

  return (
    <div className="space-y-2">
      <SectionTitle>{label}</SectionTitle>
      {list.map((item, i) => (
        <div key={`${label}-${i}`} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...list];
              next[i] = e.target.value;
              setList(next);
            }}
            onBlur={() => commit(list)}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => commit(list.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => commit([...list, ''])}
      >
        <Plus className="mr-1 h-3 w-3" />
        Add
      </Button>
    </div>
  );
}

export function EditableLevelSelect({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: 'high' | 'medium' | 'low') => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => onSave(v as 'high' | 'medium' | 'low')}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
