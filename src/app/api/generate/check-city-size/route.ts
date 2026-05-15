import { z } from 'zod';
import { getAuthUser } from '@/lib/permissions';
import { checkCitySize } from '@/lib/scrape/google-maps';

const schema = z.object({
  nicheKeyword: z.string().min(1),
  country: z.string().min(2),
  region: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional(),
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
    const result = await checkCitySize(parsed.data);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'City size check failed';
    return Response.json({ error: message }, { status: 502 });
  }
}
