import Papa from 'papaparse';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActivityFeed } from '@/lib/history/feed';
import { getOpenerPerformance } from '@/lib/dashboard/aggregations/openers';
import type { ActivityFeedEntry } from '@/lib/history/types';

export type ExportKind = 'leads' | 'calls' | 'triggers' | 'openers' | 'activity';

export type ExportBody = {
  kind: ExportKind;
  start: string;
  end: string;
  niche_ids?: string[];
  format: 'csv' | 'json';
};

const BATCH = 1000;

function jsonCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function streamCsv(
  columns: string[],
  fetchBatch: (offset: number) => Promise<Record<string, unknown>[]>,
): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(
        enc.encode(`${Papa.unparse([{}], { columns, header: true }).split('\n')[0]}\n`),
      );
      let offset = 0;
      for (;;) {
        const rows = await fetchBatch(offset);
        if (!rows.length) break;
        controller.enqueue(
          enc.encode(`${Papa.unparse(rows, { columns, header: false })}\n`),
        );
        offset += rows.length;
        if (rows.length < BATCH) break;
      }
      controller.close();
    },
  });
}

function streamNdjson(
  fetchBatch: (offset: number) => Promise<Record<string, unknown>[]>,
): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      let offset = 0;
      for (;;) {
        const rows = await fetchBatch(offset);
        if (!rows.length) break;
        for (const row of rows) {
          controller.enqueue(enc.encode(`${JSON.stringify(row)}\n`));
        }
        offset += rows.length;
        if (rows.length < BATCH) break;
      }
      controller.close();
    },
  });
}

function flattenActivity(e: ActivityFeedEntry): Record<string, unknown> {
  return {
    kind: e.kind,
    occurred_at: e.occurred_at,
    actor_name: e.actor_name,
    business_name: e.business_name,
    city: e.city,
    region: e.region,
    niche_name: e.niche_name,
    source_id: e.source_id,
    payload: jsonCell(e.payload),
  };
}

export function buildExportStream(body: ExportBody): ReadableStream<Uint8Array> {
  const admin = createAdminClient();
  const niches = body.niche_ids?.length ? body.niche_ids : null;

  if (body.kind === 'leads') {
    const columns = [
      'id',
      'business_name',
      'status',
      'fingerprint',
      'niche_id',
      'region',
      'city',
      'country',
      'business_phone',
      'owner_name',
      'owner_email',
      'owner_email_status',
      'business_registration',
      'website',
      'created_at',
      'last_called_at',
    ];
    const fetchBatch = async (offset: number) => {
      let q = admin.from('leads').select('*').range(offset, offset + BATCH - 1);
      if (niches) q = q.in('niche_id', niches);
      const { data } = await q;
      return (data ?? []).map((r) => ({
        id: r.id,
        business_name: r.business_name,
        status: r.status,
        fingerprint: r.fingerprint,
        niche_id: r.niche_id,
        region: r.region,
        city: r.city,
        country: r.country,
        business_phone: r.business_phone,
        owner_name: r.owner_name,
        owner_email: r.owner_email,
        owner_email_status: r.owner_email_status,
        business_registration: jsonCell(r.business_registration),
        website: r.website,
        created_at: r.created_at,
        last_called_at: r.last_called_at,
      }));
    };
    return body.format === 'csv'
      ? streamCsv(columns, fetchBatch)
      : streamNdjson(fetchBatch);
  }

  if (body.kind === 'calls') {
    const columns = [
      'id',
      'lead_id',
      'actor_id',
      'called_at',
      'outcome',
      'sub_outcome',
      'notes',
      'tags',
      'sentiment_score',
      'duration_seconds',
      'opener_variant_id',
    ];
    const fetchBatch = async (offset: number) => {
      let q = admin
        .from('call_attempts')
        .select('*')
        .gte('called_at', body.start)
        .lte('called_at', body.end)
        .order('called_at', { ascending: true })
        .range(offset, offset + BATCH - 1);
      if (niches) {
        const { data: leadIds } = await admin
          .from('leads')
          .select('id')
          .in('niche_id', niches);
        const ids = (leadIds ?? []).map((l) => l.id);
        if (!ids.length) return [];
        q = q.in('lead_id', ids);
      }
      const { data } = await q;
      return (data ?? []).map((r) => ({
        id: r.id,
        lead_id: r.lead_id,
        actor_id: r.actor_id,
        called_at: r.called_at,
        outcome: r.outcome,
        sub_outcome: r.sub_outcome,
        notes: r.notes,
        tags: jsonCell(r.tags),
        sentiment_score: r.sentiment_score,
        duration_seconds: r.duration_seconds,
        opener_variant_id: r.opener_variant_id,
      }));
    };
    return body.format === 'csv'
      ? streamCsv(columns, fetchBatch)
      : streamNdjson(fetchBatch);
  }

  if (body.kind === 'triggers') {
    const columns = [
      'id',
      'lead_id',
      'trigger_type',
      'severity',
      'details',
      'detected_at',
      'expires_at',
      'is_actioned',
      'actioned_by',
    ];
    const fetchBatch = async (offset: number) => {
      let q = admin
        .from('trigger_events')
        .select(
          'id, lead_id, trigger_type, severity, details, detected_at, expires_at, is_actioned, actioned_by',
        )
        .gte('detected_at', body.start)
        .lte('detected_at', body.end)
        .order('detected_at', { ascending: true })
        .range(offset, offset + BATCH - 1);
      if (niches) {
        const { data: leads } = await admin.from('leads').select('id').in('niche_id', niches);
        const ids = (leads ?? []).map((l) => l.id);
        if (!ids.length) return [];
        q = q.in('lead_id', ids);
      }
      const { data } = await q;
      return (data ?? []).map((r) => ({
        id: r.id,
        lead_id: r.lead_id,
        trigger_type: r.trigger_type,
        severity: r.severity,
        details: jsonCell(r.details),
        detected_at: r.detected_at,
        expires_at: r.expires_at,
        is_actioned: r.is_actioned,
        actioned_by: r.actioned_by,
      }));
    };
    return body.format === 'csv'
      ? streamCsv(columns, fetchBatch)
      : streamNdjson(fetchBatch);
  }

  if (body.kind === 'openers') {
    const fetchBatch = async () => {
      const rows = await getOpenerPerformance(body.start, body.end, {
        nicheId: niches?.[0],
      });
      const filtered = niches?.length
        ? rows.filter((r) => r.niche_id && niches.includes(r.niche_id))
        : rows;
      return filtered.map((r) => ({ ...r })) as Record<string, unknown>[];
    };
    const columns = [
      'id',
      'hook_type',
      'opener_text',
      'niche_name',
      'is_personalized',
      'times_used',
      'times_answered',
      'times_interested',
      'meetings_set',
      'conversion_rate',
      'last_used_at',
    ];
    if (body.format === 'csv') {
      return streamCsv(columns, async (offset) => {
        if (offset > 0) return [];
        return fetchBatch();
      });
    }
    return streamNdjson(async (offset) => {
      if (offset > 0) return [];
      return fetchBatch();
    });
  }

  const columns = [
    'kind',
    'occurred_at',
    'actor_name',
    'business_name',
    'city',
    'region',
    'niche_name',
    'source_id',
    'payload',
  ];
  let actCursor: string | null = null;
  const fetchActivity = async () => {
    const result = await getActivityFeed({
      userIds: null,
      start: body.start,
      end: body.end,
      activityTypes: null,
      leadSearch: null,
      nicheId: niches?.[0] ?? null,
      cursor: actCursor,
      limit: BATCH,
    });
    actCursor = result.nextCursor;
    return result.entries.map(flattenActivity);
  };
  const fetchActivityBatch = async (offset: number) => {
    if (offset > 0 && !actCursor) return [];
    const rows = await fetchActivity();
    return rows;
  };
  return body.format === 'csv'
    ? streamCsv(columns, fetchActivityBatch)
    : streamNdjson(fetchActivityBatch);
}
