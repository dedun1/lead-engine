export type GenerateSseEvent =
  | { type: 'started'; job_id: string; estimated_count: number }
  | { type: 'listing_scraped'; business_name: string; fingerprint: string }
  | { type: 'lead_inserted'; lead_id: string; business_name: string }
  | { type: 'lead_skipped_duplicate'; business_name: string }
  | { type: 'lead_skipped_blocklist'; business_name: string; reason: string | null }
  | { type: 'lead_skipped_filter'; business_name: string; filter_reason: string }
  | { type: 'progress'; current: number; total: number }
  | {
      type: 'completed';
      job_id: string;
      inserted_count: number;
      duplicates_count: number;
      blocked_count: number;
      filtered_count: number;
      actual_cost_usd: number;
    }
  | { type: 'error'; message: string; job_id: string };

export function encodeSse(event: GenerateSseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function createSseStream(
  runner: (send: (e: GenerateSseEvent) => void) => Promise<void>,
  signal: AbortSignal,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (event: GenerateSseEvent) => {
        if (signal.aborted) return;
        controller.enqueue(encoder.encode(encodeSse(event)));
      };
      try {
        await runner(send);
      } finally {
        controller.close();
      }
    },
  });
}
