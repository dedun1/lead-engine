import { z } from 'zod';
import { getAuthUser } from '@/lib/permissions';
import { estimateGenerationCost } from '@/lib/cost/estimator';

const schema = z.object({
  quantity: z.number().int().min(10).max(200),
  niche_id: z.string().uuid(),
  enrichment_sources: z.array(z.string()),
});

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }
  try {
    const estimate = await estimateGenerationCost({
      quantity: parsed.data.quantity,
      niche_id: parsed.data.niche_id,
      enrichmentSources: parsed.data.enrichment_sources,
    });
    return Response.json(estimate);
  } catch {
    return Response.json({ error: 'Estimate failed' }, { status: 500 });
  }
}
