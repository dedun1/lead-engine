import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BulkReassign } from './bulk-reassign';
import { BulkStatus } from './bulk-status';
import { BulkDelete } from './bulk-delete';
import { BulkDedupe } from './bulk-dedupe';

export default async function AdminBulkPage() {
  const supabase = createClient();
  const [{ data: niches }, { data: members }] = await Promise.all([
    supabase.from('niches').select('id, name').order('name'),
    supabase
      .from('team_members')
      .select('id, display_name, email')
      .eq('is_active', true)
      .order('display_name'),
  ]);

  return (
    <div className="space-y-8">
      <BulkReassign niches={niches ?? []} members={members ?? []} />
      <BulkStatus niches={niches ?? []} members={members ?? []} />
      <BulkDelete niches={niches ?? []} members={members ?? []} />
      <BulkDedupe niches={niches ?? []} />
      <section className="rounded-lg border p-4">
        <h2 className="text-base font-medium">Bulk export shortcut</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Export with filters pre-filled on the Data export tab.
        </p>
        <Link
          href="/settings/admin/export"
          className="mt-3 inline-block text-sm text-primary underline"
        >
          Go to Data export →
        </Link>
      </section>
    </div>
  );
}
