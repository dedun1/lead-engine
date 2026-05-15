import { createAdminClient } from '@/lib/supabase/admin';
import { scrapeGoogleMaps, closeMapsBrowser } from '@/lib/scrape/google-maps';
import type { GenerationFilters } from './filters';
import type { GenerateSseEvent } from './sse';
import { estimateGenerationCost } from '@/lib/cost/estimator';
import type { CountryCode } from '@/lib/geo/countries';
import { processListingBatch } from './process-listings';

export type RunJobInput = {
  job_id: string;
  niche_id: string;
  niche_keyword: string;
  country: CountryCode;
  region: string;
  city: string;
  postal_code?: string;
  quantity: number;
  filters: GenerationFilters;
  enrichment_sources: string[];
  started_by: string;
  signal: AbortSignal;
};

export async function runGenerationJob(
  input: RunJobInput,
  send: (event: GenerateSseEvent) => void,
): Promise<void> {
  const admin = createAdminClient();
  const estimate = await estimateGenerationCost({
    quantity: input.quantity,
    niche_id: input.niche_id,
    enrichmentSources: input.enrichment_sources,
  });

  await admin
    .from('generation_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      estimated_cost_usd: estimate.total_usd,
      cost_breakdown: { line_items: estimate.line_items },
    })
    .eq('id', input.job_id);

  send({
    type: 'started',
    job_id: input.job_id,
    estimated_count: input.quantity,
  });

  let inserted = 0;
  let duplicates = 0;
  let blocked = 0;
  let filtered = 0;

  try {
    const listings = await scrapeGoogleMaps({
      nicheKeyword: input.niche_keyword,
      country: input.country,
      region: input.region,
      city: input.city,
      postalCode: input.postal_code,
      maxResults: Math.max(input.quantity * 3, 30),
    });

    const counts = await processListingBatch({
      listings,
      input: {
        job_id: input.job_id,
        niche_id: input.niche_id,
        country: input.country,
        region: input.region,
        city: input.city,
        postal_code: input.postal_code,
        quantity: input.quantity,
        filters: input.filters,
      },
      signal: input.signal,
      send,
      counters: { inserted, duplicates, blocked, filtered },
    });
    inserted = counts.inserted;
    duplicates = counts.duplicates;
    blocked = counts.blocked;
    filtered = counts.filtered;

    const actual = await estimateGenerationCost({
      quantity: inserted,
      niche_id: input.niche_id,
      enrichmentSources: input.enrichment_sources,
    });

    await admin
      .from('generation_jobs')
      .update({
        status: input.signal.aborted ? 'cancelled' : 'completed',
        completed_at: new Date().toISOString(),
        delivered_count: inserted,
        dedup_skip_count: duplicates,
        blocklist_skip_count: blocked,
        actual_cost_usd: actual.total_usd,
        cost_breakdown: {
          line_items: actual.line_items,
          filtered_count: filtered,
        },
      })
      .eq('id', input.job_id);

    if (!input.signal.aborted) {
      send({
        type: 'completed',
        job_id: input.job_id,
        inserted_count: inserted,
        duplicates_count: duplicates,
        blocked_count: blocked,
        filtered_count: filtered,
        actual_cost_usd: actual.total_usd,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Generation failed';
    await admin
      .from('generation_jobs')
      .update({
        status: 'failed',
        error_log: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', input.job_id);
    send({ type: 'error', message, job_id: input.job_id });
  } finally {
    await closeMapsBrowser();
  }
}
