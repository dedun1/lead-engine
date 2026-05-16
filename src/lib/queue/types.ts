import type { LeadStatus } from '@/lib/pipeline/types';

export type QueueFilter = 'all' | 'mine' | 'unassigned';

export type QueueLeadRow = {
  id: string;
  business_name: string;
  status: LeadStatus;
  city: string | null;
  assigned_to: string | null;
  created_at: string;
};

export type QueueLeadsResult = {
  leads: QueueLeadRow[];
  calledToday: number;
};