'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ACTIVITY_TYPE_CHIPS, type ActivityChipId } from '@/lib/history/types';

type Member = { id: string; display_name: string | null; email: string };
type Niche = { id: string; name: string };

export function HistoryFilters({
  members,
  niches,
  currentUserId,
}: {
  members: Member[];
  niches: Niche[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(searchParams.get('q') ?? '');

  const scope = searchParams.get('scope') ?? 'my';
  const range = searchParams.get('range') ?? '7d';
  const types = useMemo(
    () => searchParams.get('types')?.split(',').filter(Boolean) ?? [],
    [searchParams],
  );

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete('cursor');
      mutate(p);
      router.push(`/history?${p.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!searchParams.get('range')) {
      const p = new URLSearchParams(searchParams.toString());
      p.set('range', '7d');
      if (!p.get('scope')) p.set('scope', 'my');
      router.replace(`/history?${p.toString()}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchDraft.trim();
      const current = searchParams.get('q') ?? '';
      if (q === current) return;
      pushParams((p) => {
        if (q) p.set('q', q);
        else p.delete('q');
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchDraft, searchParams, pushParams]);

  function toggleType(id: ActivityChipId) {
    pushParams((p) => {
      const next = types.includes(id) ? types.filter((t) => t !== id) : [...types, id];
      if (next.length) p.set('types', next.join(','));
      else p.delete('types');
    });
  }

  function toggleMember(id: string) {
    pushParams((p) => {
      const current = p.getAll('members');
      const next = current.includes(id)
        ? current.filter((m) => m !== id)
        : [...current, id];
      p.delete('members');
      next.forEach((m) => p.append('members', m));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={scope === 'my' ? 'default' : 'outline'}
          onClick={() =>
            pushParams((p) => {
              p.set('scope', 'my');
              p.delete('members');
            })
          }
        >
          My activity
        </Button>
        <Button
          size="sm"
          variant={scope === 'team' ? 'default' : 'outline'}
          onClick={() =>
            pushParams((p) => {
              p.set('scope', 'team');
              if (currentUserId) p.append('members', currentUserId);
            })
          }
        >
          Team activity
        </Button>
        <Select
          value={range}
          onValueChange={(v) => pushParams((p) => p.set('range', v))}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        {range === 'custom' && (
          <>
            <Input
              type="date"
              className="w-[150px]"
              defaultValue={searchParams.get('from') ?? ''}
              onChange={(e) =>
                pushParams((p) => {
                  if (e.target.value) p.set('from', e.target.value);
                })
              }
            />
            <Input
              type="date"
              className="w-[150px]"
              defaultValue={searchParams.get('to') ?? ''}
              onChange={(e) =>
                pushParams((p) => {
                  if (e.target.value) p.set('to', e.target.value);
                })
              }
            />
          </>
        )}
      </div>

      {scope === 'team' && (
        <div className="flex flex-wrap gap-1">
          {members.map((m) => (
            <Badge
              key={m.id}
              variant={searchParams.getAll('members').includes(m.id) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleMember(m.id)}
            >
              {m.display_name ?? m.email}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {ACTIVITY_TYPE_CHIPS.map((c) => (
          <Badge
            key={c.id}
            variant={types.length === 0 || types.includes(c.id) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleType(c.id)}
          >
            {c.label}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search business name…"
          className="max-w-xs"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
        />
        <Select
          value={searchParams.get('niche') ?? 'all'}
          onValueChange={(v) =>
            pushParams((p) => {
              if (v === 'all') p.delete('niche');
              else p.set('niche', v);
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Niche" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All niches</SelectItem>
            {niches.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
