import type { ActivityChipId, ActivityFeedParams } from './types';
import { ACTIVITY_TYPE_CHIPS } from './types';

const ALL_CHIP_IDS = ACTIVITY_TYPE_CHIPS.map((c) => c.id);

export type HistorySearchParams = {
  scope?: string;
  members?: string | string[];
  range?: string;
  from?: string;
  to?: string;
  types?: string;
  q?: string;
  niche?: string;
  cursor?: string;
};

export function parseHistorySearchParams(
  sp: URLSearchParams,
  currentUserId: string | null,
): ActivityFeedParams {
  return parseHistoryParams(
    {
      scope: sp.get('scope') ?? undefined,
      members: sp.getAll('members'),
      range: sp.get('range') ?? undefined,
      from: sp.get('from') ?? undefined,
      to: sp.get('to') ?? undefined,
      types: sp.get('types') ?? undefined,
      q: sp.get('q') ?? undefined,
      niche: sp.get('niche') ?? undefined,
      cursor: sp.get('cursor') ?? undefined,
    },
    currentUserId,
  );
}

export function parseHistoryParams(
  params: HistorySearchParams,
  currentUserId: string | null,
): ActivityFeedParams {
  const scope = params.scope ?? 'my';
  let userIds: string[] | null = null;

  if (scope === 'my' && currentUserId) {
    userIds = [currentUserId];
  } else if (scope === 'team') {
    const raw = params.members;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    userIds = list.length ? list : null;
  }

  const { start, end } = rangeToDates(params.range, params.from, params.to);

  const typesRaw = params.types?.split(',').filter(Boolean) ?? [];
  const activityTypes =
    typesRaw.length === 0
      ? null
      : (typesRaw.filter((t) =>
          ALL_CHIP_IDS.includes(t as ActivityChipId),
        ) as ActivityChipId[]);

  return {
    userIds,
    start,
    end,
    activityTypes,
    leadSearch: params.q?.trim() || null,
    nicheId: params.niche || null,
    cursor: params.cursor || null,
    limit: 50,
  };
}

function rangeToDates(
  range?: string,
  from?: string,
  to?: string,
): { start: string; end: string } {
  const end = new Date();
  let start = new Date();

  switch (range) {
    case '24h':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      if (from) start = new Date(from);
      if (to) return { start: start.toISOString(), end: new Date(to).toISOString() };
      break;
    case '7d':
    default:
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

export function historyParamsToQuery(
  params: ActivityFeedParams & { scope: string; members?: string[] },
): URLSearchParams {
  const p = new URLSearchParams();
  p.set('scope', params.scope);
  if (params.members?.length) {
    params.members.forEach((m) => p.append('members', m));
  }
  if (params.activityTypes?.length) {
    p.set('types', params.activityTypes.join(','));
  }
  if (params.leadSearch) p.set('q', params.leadSearch);
  if (params.nicheId) p.set('niche', params.nicheId);
  if (params.cursor) p.set('cursor', params.cursor);
  return p;
}
