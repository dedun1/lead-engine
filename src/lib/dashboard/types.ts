export type DateRangePeriod =
  | 'this_week'
  | 'last_week'
  | 'last_30'
  | 'last_90'
  | 'custom';

export type DateRange = {
  period: DateRangePeriod;
  start: string;
  end: string;
  label: string;
};

export type AtAGlanceMetrics = {
  calls: number;
  connect_rate: number;
  interested_rate: number;
  meetings: number;
  deltas: {
    calls: number | null;
    connect_rate: number | null;
    interested_rate: number | null;
    meetings: number | null;
  };
  sparklines: {
    calls: number[];
    connect_rate: number[];
    interested_rate: number[];
    meetings: number[];
  };
};

export type OpenerPerformanceRow = {
  id: string;
  hook_type: string | null;
  opener_text: string;
  is_personalized: boolean;
  niche_id: string | null;
  niche_name: string | null;
  business_name: string | null;
  times_used: number;
  times_answered: number;
  times_interested: number;
  meetings_set: number;
  conversion_rate: number;
  last_used_at: string | null;
};

export type NichePerformanceRow = {
  niche_id: string;
  niche_name: string;
  naics_code: string | null;
  total_leads: number;
  calls: number;
  connect_rate: number;
  interested_rate: number;
  meetings: number;
  avg_sentiment: number | null;
  cost_per_meeting: number | null;
  status: 'worth' | 'inconclusive' | 'skip';
};

export type HeatmapCell = {
  day: number;
  hour: number;
  calls: number;
  connect_rate: number;
  interested_rate: number;
};

export type TagStat = {
  tag: string;
  uses: number;
  bookings: number;
  booking_rate: number;
};

export type SentimentBucket = {
  sentiment: number;
  calls: number;
  bookings: number;
  booking_rate: number;
};

export type WeeklyInsightPayload = {
  headline_observation: string;
  actionable_insights: Array<{
    insight: string;
    evidence: string;
    recommendation: string;
  }>;
  experiments_to_try: Array<{
    hypothesis: string;
    how_to_test: string;
    minimum_calls_needed: number;
  }>;
};
