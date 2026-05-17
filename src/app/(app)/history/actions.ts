'use server';

import { getAuthUser } from '@/lib/permissions';
import { getActivityFeed } from '@/lib/history/feed';
import type { ActivityFeedParams, ActivityFeedResult } from '@/lib/history/types';

export async function fetchActivityFeedAction(
  params: ActivityFeedParams,
): Promise<ActivityFeedResult> {
  const user = await getAuthUser();
  if (!user) return { entries: [], nextCursor: null };
  return getActivityFeed(params);
}
