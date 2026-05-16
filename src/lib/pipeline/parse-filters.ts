import type { LeadStatus, PipelineFilters } from './types';
import { LEAD_STATUSES } from './types';

export function parsePipelineFilters(
  params: Record<string, string | string[] | undefined>,
): PipelineFilters {
  const get = (key: string) => {
    const v = params[key];
    return typeof v === 'string' ? v : undefined;
  };

  const statusRaw = get('status');
  const statuses = statusRaw
    ? (statusRaw.split(',').filter((s) =>
        LEAD_STATUSES.includes(s as LeadStatus),
      ) as LeadStatus[])
    : undefined;

  const sort = get('sort') as PipelineFilters['sort'];
  const sortDir = get('sortDir') === 'asc' ? 'asc' : 'desc';

  return {
    nicheId: get('niche'),
    country: get('country'),
    region: get('region'),
    city: get('city'),
    statuses: statuses?.length ? statuses : undefined,
    dateRange: (get('dateRange') as PipelineFilters['dateRange']) ?? 'all',
    search: get('q'),
    cursor: get('cursor'),
    sort: sort ?? undefined,
    sortDir,
    pitchingNichesOnly: get('allNiches') !== '1',
  };
}

export function filtersToSearchParams(filters: PipelineFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.nicheId) p.set('niche', filters.nicheId);
  if (filters.country) p.set('country', filters.country);
  if (filters.region) p.set('region', filters.region);
  if (filters.city) p.set('city', filters.city);
  if (filters.statuses?.length) p.set('status', filters.statuses.join(','));
  if (filters.dateRange && filters.dateRange !== 'all') {
    p.set('dateRange', filters.dateRange);
  }
  if (filters.search) p.set('q', filters.search);
  if (filters.cursor) p.set('cursor', filters.cursor);
  if (filters.sort) p.set('sort', filters.sort);
  if (filters.sortDir) p.set('sortDir', filters.sortDir);
  if (filters.pitchingNichesOnly === false) p.set('allNiches', '1');
  return p;
}
