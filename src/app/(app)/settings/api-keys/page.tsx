import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getSessionContext } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { ApiKeysForm } from './api-keys-form';

export default async function ApiKeysPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login');

  const supabase = createClient();
  const { data: rows } = await supabase
    .from('api_keys')
    .select('service, last_four');

  const savedKeys: Record<string, string | null> = {};
  for (const row of rows ?? []) {
    if (row.service) savedKeys[row.service] = row.last_four;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Settings
      </Link>
      <ApiKeysForm isAdmin={ctx.isAdmin} savedKeys={savedKeys} />
    </div>
  );
}
