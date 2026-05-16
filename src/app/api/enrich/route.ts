import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  allowEnrichment,
  enrichRetryAfterSeconds,
} from '@/lib/ai/rate-limit';
import { enrichLead } from '@/lib/enrich/coordinator';
import {
  isEnrichmentFresh,
  loadLeadForEnrich,
  persistEnrichment,
} from '@/lib/enrich/persist';
import { getAuthUser } from '@/lib/permissions';

const bodySchema = z.object({
  lead_id: z.string().uuid(),
  force_refresh: z.boolean().optional(),
  stop_when_found: z.array(z.string()).optional(),
});

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

    const { lead_id, force_refresh, stop_when_found } = parsed.data;
    const lead = await loadLeadForEnrich(lead_id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!force_refresh && (await isEnrichmentFresh(lead.enriched_at))) {
      return NextResponse.json(
        { cached: true, enriched_at: lead.enriched_at },
        { headers: { 'x-cache-hit': 'true' } },
      );
    }

    if (!allowEnrichment(user.id)) {
      const retry = enrichRetryAfterSeconds(user.id);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 503, headers: { 'Retry-After': String(retry || 60) } },
      );
    }

    const enrichLeadInput = {
      ...lead,
      socials: (lead.socials as Record<string, string> | null) ?? null,
    };

    const fields = await enrichLead(enrichLeadInput, {
      stopWhenFound: stop_when_found,
    });

    await persistEnrichment(lead_id, fields, user.id);

    return NextResponse.json({ fields, cached: false });
  } catch (error) {
    console.error('enrich failed', error);
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 });
  }
}
