import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CryptoError } from '@/lib/crypto';
import { generateNicheBaselineVariants } from '@/lib/opener/generate-baseline';
import { getAuthUser, isAdmin } from '@/lib/permissions';

const bodySchema = z.object({
  niche_id: z.string().uuid(),
  country: z.string().min(2).max(8),
  num_variants: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { niche_id, country, num_variants } = parsed.data;
    const result = await generateNicheBaselineVariants({
      nicheId: niche_id,
      country,
      userId: user.id,
      numVariants: num_variants ?? 5,
    });

    if (result.error && result.variants.length === 0) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      variants: result.variants,
      partial_error: result.error ?? null,
    });
  } catch (error) {
    if (error instanceof CryptoError) {
      return NextResponse.json(
        { error: 'Anthropic key not configured' },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: 'Baseline generation failed' }, { status: 500 });
  }
}
