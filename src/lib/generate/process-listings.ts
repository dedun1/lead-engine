import type { RawGoogleMapsListing } from '@/lib/scrape/google-maps/types';
import { insertLeadOrSkip } from '@/lib/dedup/insert-lead';
import { generateFingerprint } from '@/lib/dedup/fingerprint';
import { parsePostalFromAddress } from '@/lib/dedup/parse-postal';
import { applyListingFilters, type GenerationFilters } from './filters';
import type { GenerateSseEvent } from './sse';
import { getJobStatus, sleep } from './job-status';
import { inferTimezoneFromCoords } from '@/lib/timezone';
import type { CountryCode } from '@/lib/geo/countries';

type Counters = { inserted: number; duplicates: number; blocked: number; filtered: number };

export async function processListingBatch(opts: {
  listings: RawGoogleMapsListing[];
  input: {
    job_id: string;
    niche_id: string;
    country: CountryCode;
    region: string;
    city: string;
    postal_code?: string;
    quantity: number;
    filters: GenerationFilters;
  };
  signal: AbortSignal;
  send: (e: GenerateSseEvent) => void;
  counters: Counters;
}): Promise<Counters> {
  const c = { ...opts.counters };
  for (const listing of opts.listings) {
    if (opts.signal.aborted || c.inserted >= opts.input.quantity) break;
    let jobStatus = (await getJobStatus(opts.input.job_id))?.status;
    if (jobStatus === 'cancelled') break;
    while (jobStatus === 'paused') {
      await sleep(800);
      jobStatus = (await getJobStatus(opts.input.job_id))?.status;
      if (jobStatus === 'cancelled') break;
    }
    if (jobStatus === 'cancelled') break;

    const tz = inferTimezoneFromCoords(
      listing.lat ?? 0,
      listing.lng ?? 0,
      opts.input.country,
      opts.input.region,
    );
    const postal =
      opts.input.postal_code ??
      parsePostalFromAddress(listing.address, opts.input.country);
    opts.send({
      type: 'listing_scraped',
      business_name: listing.business_name,
      fingerprint: generateFingerprint({
        business_name: listing.business_name,
        business_phone: listing.phone_raw,
        postal_code: postal,
      }),
    });

    const filterResult = applyListingFilters(listing, opts.input.filters, tz);
    if (!filterResult.pass) {
      c.filtered += 1;
      opts.send({
        type: 'lead_skipped_filter',
        business_name: listing.business_name,
        filter_reason: filterResult.reason ?? 'filtered',
      });
      continue;
    }

    const result = await insertLeadOrSkip(listing, {
      niche_id: opts.input.niche_id,
      country: opts.input.country,
      region: opts.input.region,
      city: opts.input.city,
      timezone: tz,
      postal_override: opts.input.postal_code,
    });

    if (result.status === 'inserted') {
      c.inserted += 1;
      opts.send({
        type: 'lead_inserted',
        lead_id: result.lead_id!,
        business_name: listing.business_name,
      });
    } else if (result.status === 'skipped_duplicate') {
      c.duplicates += 1;
      opts.send({
        type: 'lead_skipped_duplicate',
        business_name: listing.business_name,
      });
    } else {
      c.blocked += 1;
      opts.send({
        type: 'lead_skipped_blocklist',
        business_name: listing.business_name,
        reason: result.block_reason ?? null,
      });
    }
    opts.send({
      type: 'progress',
      current: c.inserted,
      total: opts.input.quantity,
    });
  }
  return c;
}
