import type { LeadStatus } from './types';
import {
  LEAD_STATUS_BADGE_CLASS,
  LEAD_STATUS_DOT_CLASS,
} from '@/lib/ui/semantic-classes';

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  queued: 'Queued',
  contacted: 'Contacted',
  meeting_set: 'Meeting set',
  customer: 'Customer',
  dead: 'Dead',
  dnc: 'DNC',
};

export const STATUS_BADGE_CLASS: Record<LeadStatus, string> =
  LEAD_STATUS_BADGE_CLASS as Record<LeadStatus, string>;

export const STATUS_DOT_CLASS: Record<LeadStatus, string> =
  LEAD_STATUS_DOT_CLASS as Record<LeadStatus, string>;
