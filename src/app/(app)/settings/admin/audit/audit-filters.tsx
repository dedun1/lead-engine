'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type Member = { id: string; display_name: string | null; email: string };

export function AuditFilters({
  members,
  auditTypes,
  defaultStart,
  defaultEnd,
}: {
  members: Member[];
  auditTypes: string[];
  defaultStart: string;
  defaultEnd: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedActors = searchParams.getAll('actors');
  const selectedTypes =
    searchParams.get('types')?.split(',').filter(Boolean) ?? [];

  function push(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('cursor');
    mutate(p);
    router.push(`/settings/admin/audit?${p.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div>
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            className="w-[150px]"
            defaultValue={defaultStart}
            onChange={(e) =>
              push((p) => p.set('start', new Date(e.target.value).toISOString()))
            }
          />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            className="w-[150px]"
            defaultValue={defaultEnd}
            onChange={(e) =>
              push((p) => p.set('end', new Date(e.target.value).toISOString()))
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {members.map((m) => (
          <Badge
            key={m.id}
            variant={selectedActors.includes(m.id) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              push((p) => {
                const cur = p.getAll('actors');
                p.delete('actors');
                const next = cur.includes(m.id)
                  ? cur.filter((x) => x !== m.id)
                  : [...cur, m.id];
                next.forEach((id) => p.append('actors', id));
              })
            }
          >
            {m.display_name ?? m.email}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {auditTypes.map((t) => (
          <Badge
            key={t}
            variant={
              selectedTypes.length === 0 || selectedTypes.includes(t)
                ? 'default'
                : 'outline'
            }
            className="cursor-pointer"
            onClick={() =>
              push((p) => {
                const next = selectedTypes.includes(t)
                  ? selectedTypes.filter((x) => x !== t)
                  : [...selectedTypes, t];
                if (next.length) p.set('types', next.join(','));
                else p.delete('types');
              })
            }
          >
            {t}
          </Badge>
        ))}
      </div>
    </div>
  );
}
