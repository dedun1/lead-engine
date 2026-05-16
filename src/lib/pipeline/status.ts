import type { LeadStatus } from './types';

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  queued: 'Queued',
  contacted: 'Contacted',
  meeting_set: 'Meeting set',
  customer: 'Customer',
  dead: 'Dead',
  dnc: 'DNC',
};

export const STATUS_BADGE_CLASS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  queued: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  meeting_set: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  customer: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200',
  dead: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  dnc: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};
