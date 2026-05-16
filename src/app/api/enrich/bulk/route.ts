import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  allowEnrichment,
  enrichRetryAfterSeconds,
} from '@/lib/ai/rate-limit';
import { enrichLead } from '@/lib/enrich/coordinator';
import { persistEnrichment, loadLeadForEnrich } from '@/lib/enrich/persist';
import { getAuthUser } from '@/lib/permissions';

const bodySchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(50),
  stop_when_found: z.array(z.string()).optional(),
});

const CONCURRENCY = 3;

async function enrichOne(
  leadId: string,
  userId: string,
  stopWhenFound?: string[],
): Promise<{ lead_id: string; ok: boolean; error?: string }> {
  try {
    const lead = await loadLeadForEnrich(leadId);
    if (!lead) return { lead_id: leadId, ok: false, error: 'not_found' };
    const fields = await enrichLead(
      {
        ...lead,
        socials: (lead.socials as Record<string, string> | null) ?? null,
      },
      { stopWhenFound: stopWhenFound },
    );
    await persistEnrichment(leadId, fields, userId);
    return { lead_id: leadId, ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'failed';
    return { lead_id: leadId, ok: false, error: msg };
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    if (!allowEnrichment(user.id)) {
      const retry = enrichRetryAfterSeconds(user.id);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 503, headers: { 'Retry-After': String(retry || 60) } },
      );
    }

    const { lead_ids, stop_when_found } = parsed.data;
    const results: Array<{ lead_id: string; ok: boolean; error?: string }> = [];

    for (let i = 0; i < lead_ids.length; i += CONCURRENCY) {
      const batch = lead_ids.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((id) => enrichOne(id, user.id, stop_when_found)),
      );
      results.push(...batchResults);
    }

    const done = results.filter((r) => r.ok).length;
    return NextResponse.json({
      total: lead_ids.length,
      completed: done,
      failed: lead_ids.length - done,
      results,
    });
  } catch {
    return NextResponse.json({ error: 'Bulk enrichment failed' }, { status: 500 });
  }
}
