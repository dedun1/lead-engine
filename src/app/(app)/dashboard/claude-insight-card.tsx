'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { dismissWeeklyInsight } from './insight-actions';
import type { WeeklyInsightPayload } from '@/lib/dashboard/types';
import type { Database } from '@/types/database.types';

type InsightRow = Database['public']['Tables']['weekly_insights']['Row'];

type InsightApiResponse = {
  state?: string;
  insight?: InsightRow | null;
  calls_needed?: number;
  calls_made?: number;
  error?: string;
};

function parseInsights(row: InsightRow | null): WeeklyInsightPayload | null {
  if (!row) return null;
  if (row.headline_observation) {
    return {
      headline_observation: row.headline_observation,
      actionable_insights: (row.actionable_insights ??
        []) as WeeklyInsightPayload['actionable_insights'],
      experiments_to_try: (row.experiments_to_try ??
        []) as WeeklyInsightPayload['experiments_to_try'],
    };
  }
  if (row.insight_text) {
    return {
      headline_observation: row.insight_text,
      actionable_insights: [],
      experiments_to_try: [],
    };
  }
  return null;
}

export function ClaudeInsightCard({
  initialInsight,
  dismissed,
  hasKey,
  isAdmin,
}: {
  initialInsight: InsightRow | null;
  dismissed: boolean;
  hasKey: boolean;
  isAdmin: boolean;
}) {
  const [insight, setInsight] = useState(initialInsight);
  const [loading, setLoading] = useState(!initialInsight && hasKey);
  const [insufficient, setInsufficient] = useState<{
    made: number;
    needed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const parsed = parseInsights(insight);

  const loadInsight = async (force = false) => {
    setLoading(true);
    setError(null);
    setInsufficient(null);
    try {
      const res = await fetch('/api/ai/weekly-insight', {
        method: 'POST',
        headers: force ? { 'Content-Type': 'application/json' } : undefined,
        body: force ? JSON.stringify({ force_regenerate: true }) : undefined,
      });
      const json = (await res.json()) as InsightApiResponse;
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      if (json.state === 'no_anthropic_key') return;
      if (json.state === 'insufficient_data') {
        setInsufficient({
          made: json.calls_made ?? 0,
          needed: json.calls_needed ?? 10,
        });
        return;
      }
      if (json.insight) setInsight(json.insight);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasKey || initialInsight || dismissed) return;
    void loadInsight(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [hasKey, initialInsight, dismissed]);

  if (!hasKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This week&apos;s Claude insights</CardTitle>
          <CardDescription>
            Add Anthropic key in Settings to unlock weekly insights.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (dismissed) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This week&apos;s Claude insights</CardTitle>
          <CardDescription>Generating weekly insights…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (insufficient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This week&apos;s Claude insights</CardTitle>
          <CardDescription>
            {insufficient.made} / {insufficient.needed} calls this week — make{' '}
            {Math.max(0, insufficient.needed - insufficient.made)} more to unlock
            AI insights.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This week&apos;s Claude insights</CardTitle>
          <CardDescription className="text-amber-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => void loadInsight(false)}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!parsed) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>This week&apos;s Claude insights</CardTitle>
          <CardDescription className="mt-2 text-base text-foreground">
            {parsed.headline_observation}
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadInsight(true)}
            >
              Regenerate
            </Button>
          )}
          {insight?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissWeeklyInsight(insight.id)}
            >
              Dismiss
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="text-sm font-medium">
            Actionable insights
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 grid gap-3 md:grid-cols-2">
            {parsed.actionable_insights.map((item, i) => (
              <Card key={i} className="bg-muted/30">
                <CardContent className="pt-4 text-sm space-y-2">
                  <p className="font-medium">{item.insight}</p>
                  <p className="text-muted-foreground">{item.evidence}</p>
                  <p>{item.recommendation}</p>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
        {parsed.experiments_to_try.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Experiments to try</p>
            <ul className="space-y-2 text-sm">
              {parsed.experiments_to_try.map((ex, i) => (
                <li key={i} className="rounded-md border p-3">
                  <p className="font-medium">{ex.hypothesis}</p>
                  <p className="text-muted-foreground">{ex.how_to_test}</p>
                  <p className="text-xs mt-1">
                    Min calls: {ex.minimum_calls_needed}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
