'use client';

import Link from 'next/link';
import type { LeadDetail } from '@/lib/pipeline/types';

export function LeadIntelligenceTab({ lead }: { lead: LeadDetail }) {
  const intel = lead.niche_intelligence;
  const nicheName = lead.niche?.name ?? 'this niche';

  if (!intel) {
    return (
      <p className="text-sm text-muted-foreground">
        Niche intelligence not yet generated for {nicheName} in {lead.country}.{' '}
        <Link href="/niches" className="text-primary underline">
          Generate from Niche Explorer → {nicheName}
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg border p-4 space-y-2">
        <p className="font-medium">Niche intelligence (read-only)</p>
        <p>{intel.summary}</p>
        {intel.pain_points?.length ? (
          <ul className="list-disc pl-5 text-muted-foreground">
            {intel.pain_points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : null}
        {intel.twentyfour_pitch_angles?.length ? (
          <>
            <p className="font-medium pt-2">Pitch angles</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {intel.twentyfour_pitch_angles.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
        <p className="font-medium text-foreground">Pitch hooks for this lead</p>
        <p className="mt-1 text-xs">
          Personalized opener coming in BUILD Prompt 14
        </p>
      </div>
    </div>
  );
}
