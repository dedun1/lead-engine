import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';
import { testDecryptedApiKey } from '@/lib/api-keys/test-key';
import { isAdmin, getAuthUser } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = (await request.json()) as { service?: string };
    const service = body.service?.trim();
    if (!service) {
      return NextResponse.json({ error: 'Missing service' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('api_keys')
      .select('encrypted_value')
      .eq('service', service)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data?.encrypted_value) {
      return NextResponse.json({ error: 'No saved key' }, { status: 404 });
    }

    const result = await testDecryptedApiKey(
      service,
      decrypt(data.encrypted_value),
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      note: 'note' in result ? result.note : undefined,
    });
  } catch {
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
