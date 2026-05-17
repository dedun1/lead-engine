import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/require-admin';
import { buildExportStream, type ExportBody } from '@/lib/admin/export-stream';

const bodySchema = z.object({
  kind: z.enum(['leads', 'calls', 'triggers', 'openers', 'activity']),
  start: z.string(),
  end: z.string(),
  niche_ids: z.array(z.string().uuid()).optional(),
  format: z.enum(['csv', 'json']).default('csv'),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const body = parsed.data as ExportBody;
  const date = new Date().toISOString().slice(0, 10);
  const ext = body.format === 'csv' ? 'csv' : 'jsonl';
  const stream = buildExportStream(body);

  return new NextResponse(stream, {
    headers: {
      'Content-Type':
        body.format === 'csv' ? 'text/csv; charset=utf-8' : 'application/x-ndjson',
      'Content-Disposition': `attachment; filename="leadengine-${body.kind}-${date}.${ext}"`,
      'Cache-Control': 'no-store',
    },
  });
}
