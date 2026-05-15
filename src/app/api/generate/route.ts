import { z } from 'zod';
import { getAuthUser, getTeamMemberForUser } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { runGenerationJob } from '@/lib/generate/run-job';
import { createSseStream } from '@/lib/generate/sse';
import type { GenerationFilters } from '@/lib/generate/filters';

const bodySchema = z.object({
  niche_id: z.string().uuid(),
  country: z.enum(['US', 'CA', 'UK', 'AU']),
  region: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional(),
  quantity: z.number().int().min(10).max(200),
  filters: z
    .object({
      has_website: z.enum(['any', 'required', 'not_allowed']).optional(),
      rating_min: z.number().optional(),
      rating_max: z.number().optional(),
      review_count_min: z.number().int().optional(),
      review_count_max: z.number().int().optional(),
      currently_open: z.enum(['any', 'open_now', 'opens_within_2h']).optional(),
    })
    .optional(),
  enrichment_sources: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400,
    });
  }

  const body = parsed.data;
  const admin = createAdminClient();
  const member = await getTeamMemberForUser(user.id);

  const { data: niche } = await admin
    .from('niches')
    .select('id, name, is_actively_pitching')
    .eq('id', body.niche_id)
    .maybeSingle();

  if (!niche?.is_actively_pitching) {
    return new Response(
      JSON.stringify({ error: 'Niche is not actively pitching' }),
      { status: 400 },
    );
  }

  const { data: job, error: jobErr } = await admin
    .from('generation_jobs')
    .insert({
      niche_id: body.niche_id,
      country: body.country,
      region: body.region,
      city: body.city,
      postal_code: body.postalCode ?? null,
      requested_count: body.quantity,
      filters: (body.filters ?? {}) as GenerationFilters,
      status: 'running',
      started_by: member?.id ?? user.id,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (jobErr || !job) {
    return new Response(JSON.stringify({ error: 'Failed to create job' }), {
      status: 500,
    });
  }

  const enrichment =
    body.enrichment_sources ?? ['google_maps_scrape', 'claude_haiku_summary'];

  const stream = createSseStream(
    (send) =>
      runGenerationJob(
        {
          job_id: job.id,
          niche_id: body.niche_id,
          niche_keyword: niche.name,
          country: body.country,
          region: body.region,
          city: body.city,
          postal_code: body.postalCode,
          quantity: body.quantity,
          filters: (body.filters ?? {}) as GenerationFilters,
          enrichment_sources: enrichment,
          started_by: member?.id ?? user.id,
          signal: request.signal,
        },
        send,
      ),
    request.signal,
  );

  request.signal.addEventListener('abort', () => {
    void admin
      .from('generation_jobs')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', job.id);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
