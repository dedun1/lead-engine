import type { Database } from '@/types/database.types';

export type LeadStatus =
  | 'new'
  | 'queued'
  | 'contacted'
  | 'meeting_set'
  | 'customer'
  | 'dead'
  | 'dnc';

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'queued',
  'contacted',
  'meeting_set',
  'customer',
  'dead',
  'dnc',
];

export type PipelineFilters = {
  nicheId?: string;
  country?: string;
  region?: string;
  city?: string;
  statuses?: LeadStatus[];
  dateRange?: 'week' | '7d' | '30d' | 'all';
  search?: string;
  cursor?: string;
  sort?: 'business_name' | 'status' | 'rating' | 'last_activity_at';
  sortDir?: 'asc' | 'desc';
  pitchingNichesOnly?: boolean;
};

export type PipelineLeadRow = {
  id: string;
  business_name: string;
  status: LeadStatus;
  business_phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  business_hours: Database['public']['Tables']['leads']['Row']['business_hours'];
  timezone: string | null;
  assigned_to: string | null;
  assignee_name: string | null;
  last_activity_at: string | null;
  last_activity_type: string | null;
  created_at: string;
  niche_id: string | null;
  niche_name: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_email_status: string | null;
  enriched_at: string | null;
};

export type LeadDetail = Database['public']['Tables']['leads']['Row'] & {
  niche: { id: string; name: string; naics_code: string | null } | null;
  assignee: { id: string; display_name: string | null } | null;
  niche_intelligence: Database['public']['Tables']['niche_intelligence']['Row'] | null;
  activities: Database['public']['Tables']['lead_activities']['Row'][];
};

export type FetchLeadsResult = {
  leads: PipelineLeadRow[];
  nextCursor: string | null;
  totalCount: number;
};

export type PitchingNiche = { id: string; name: string; naics_code: string | null };
