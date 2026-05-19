'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Flame, Phone, ListPlus, X, Target } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  payloadSummary,
  SEVERITY_CLASS,
  TRIGGER_LABELS,
  TRIGGER_WHY,
} from '@/lib/triggers/display';
import type { HotListTrigger } from './fetch-triggers';
import type { TriggerType } from '@/lib/triggers/types';
import { dismissTrigger, addLeadToQueue } from './actions';
import { formatForTelLink } from '@/lib/phone';
import { LeadDetailDrawer } from '../pipeline/lead-detail-drawer';

const TYPES: TriggerType[] = [
  'review_velocity_spike',
  'recent_negative_review',
  'storm_in_area',
  'new_business_registration',
  'website_change',
  'facebook_resurrection',
  'google_traffic_spike',
];

type TeamMember = { id: string; display_name: string | null; email: string };

export function HotListClient({
  initialTriggers,
  lastRefresh,
  isAdmin,
  niches,
  regions,
  teamMembers,
  userId,
}: {
  initialTriggers: HotListTrigger[];
  lastRefresh: string | null;
  isAdmin: boolean;
  niches: { id: string; name: string }[];
  regions: string[];
  teamMembers: TeamMember[];
  userId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'severity' | 'detected_at' | 'lead_name'>('severity');
  const [myOnly, setMyOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<Set<TriggerType>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set());
  const [nicheFilter, setNicheFilter] = useState<Set<string>>(new Set());
  const [regionFilter, setRegionFilter] = useState<Set<string>>(new Set());
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = [...initialTriggers];
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.lead.business_name.toLowerCase().includes(s) ||
          (r.lead.city ?? '').toLowerCase().includes(s),
      );
    }
    if (typeFilter.size) rows = rows.filter((r) => typeFilter.has(r.trigger_type));
    if (severityFilter.size) rows = rows.filter((r) => severityFilter.has(r.severity ?? ''));
    if (nicheFilter.size) rows = rows.filter((r) => r.lead.niche_id && nicheFilter.has(r.lead.niche_id));
    if (regionFilter.size) rows = rows.filter((r) => r.lead.region && regionFilter.has(r.lead.region));
    if (myOnly && userId) rows = rows.filter((r) => r.lead.assigned_to === userId);
    const sevRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    rows.sort((a, b) => {
      if (sort === 'lead_name') return a.lead.business_name.localeCompare(b.lead.business_name);
      if (sort === 'detected_at') return (b.detected_at ?? '').localeCompare(a.detected_at ?? '');
      const sd = (sevRank[b.severity ?? ''] ?? 0) - (sevRank[a.severity ?? ''] ?? 0);
      return sd || (b.detected_at ?? '').localeCompare(a.detected_at ?? '');
    });
    return rows;
  }, [initialTriggers, search, typeFilter, severityFilter, nicheFilter, regionFilter, sort, myOnly, userId]);

  async function refreshTriggers() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/triggers/detect', { method: 'POST' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Refresh failed');
        toast.success(`Created ${json.total_triggers_created} triggers (${json.duration_ms}ms)`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Refresh failed');
      }
    });
  }

  function toggleSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-chart-4" />
            Hot List — leads with reason to call now
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Last refresh:{' '}
            {lastRefresh ? new Date(lastRefresh).toLocaleString() : 'Never'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={refreshTriggers} disabled={pending}>
            {pending ? 'Refreshing…' : 'Refresh triggers'}
          </Button>
        )}
      </header>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search business or city…"
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="severity">Severity</SelectItem>
            <SelectItem value="detected_at">Detected</SelectItem>
            <SelectItem value="lead_name">Lead name</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={myOnly ? 'default' : 'outline'} size="sm" onClick={() => setMyOnly((m) => !m)}>
          My queue only
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {TYPES.map((t) => (
          <Badge
            key={t}
            variant={typeFilter.has(t) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleSet(typeFilter, t, setTypeFilter)}
          >
            {TRIGGER_LABELS[t]}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {(['critical', 'high', 'medium', 'low'] as const).map((s) => (
          <Badge
            key={s}
            variant={severityFilter.has(s) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleSet(severityFilter, s, setSeverityFilter)}
          >
            {s}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {niches.map((n) => (
          <Badge
            key={n.id}
            variant={nicheFilter.has(n.id) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleSet(nicheFilter, n.id, setNicheFilter)}
          >
            {n.name}
          </Badge>
        ))}
      </div>
      {regions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {regions.map((r) => (
            <Badge
              key={r}
              variant={regionFilter.has(r) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleSet(regionFilter, r, setRegionFilter)}
            >
              {r}
            </Badge>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        initialTriggers.length === 0 ? (
          <EmptyState
            icon={Target}
            headline="Generate leads first"
            description="Hot List finds time-sensitive opportunities among your existing leads. Generate some first."
            ctaLabel="Open Lead Generator"
            ctaHref="/generator"
          />
        ) : (
          <EmptyState
            icon={Flame}
            headline="No active triggers right now"
            description="Click Refresh Triggers to scan your leads for storms, review spikes, and other reasons to call now."
            ctaLabel={isAdmin ? 'Refresh triggers' : 'View Pipeline'}
            ctaHref={isAdmin ? undefined : '/pipeline'}
            onCtaClick={isAdmin ? () => void refreshTriggers() : undefined}
          />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((t) => (
            <article
              key={t.id}
              className="rounded-lg border p-4 space-y-3 cursor-pointer hover:bg-muted/30"
              onClick={() => setDrawerLeadId(t.lead_id)}
            >
              <div className="flex items-start justify-between gap-2">
                <Badge className={SEVERITY_CLASS[t.severity ?? 'low'] ?? ''}>
                  {t.severity}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {TRIGGER_LABELS[t.trigger_type]}
                </span>
              </div>
              <div>
                <p className="font-semibold">{t.lead.business_name}</p>
                <p className="text-sm text-muted-foreground">
                  {[t.lead.city, t.lead.region].filter(Boolean).join(', ')}
                  {t.lead.niches?.name ? ` · ${t.lead.niches.name}` : ''}
                </p>
              </div>
              <p className="text-sm">{payloadSummary(t.trigger_type, t.details)}</p>
              <p className="text-xs text-muted-foreground">{TRIGGER_WHY[t.trigger_type]}</p>
              <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {t.lead.business_phone && (
                  <Button size="sm" asChild>
                    <a href={`tel:${formatForTelLink(t.lead.business_phone)}`}>
                      <Phone className="h-3 w-3 mr-1" /> Call now
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startTransition(() => addLeadToQueue(t.lead_id))}
                >
                  <ListPlus className="h-3 w-3 mr-1" /> Add to queue
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startTransition(() => dismissTrigger(t.id))}
                >
                  <X className="h-3 w-3 mr-1" /> Dismiss
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <LeadDetailDrawer
        leadId={drawerLeadId}
        open={!!drawerLeadId}
        isAdmin={isAdmin}
        teamMembers={teamMembers}
        onClose={() => setDrawerLeadId(null)}
        onRefresh={() => router.refresh()}
      />
    </div>
  );
}
