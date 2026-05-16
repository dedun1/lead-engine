/** Top-level call outcome (State A). */
export type TopOutcome =
  | 'answered'
  | 'no_answer'
  | 'voicemail'
  | 'busy'
  | 'disconnected'
  | 'wrong_number';

/** Sub-outcome when top-level is answered (State B). */
export type SubOutcome =
  | 'interested'
  | 'not_interested'
  | 'follow_up_requested'
  | 'booked_meeting'
  | 'price_objection'
  | 'already_has_solution'
  | 'decision_maker_unavailable'
  | 'hostile'
  | 'dnc_requested';

export type OutcomeModalStep = 'outcome' | 'sub_outcome' | 'notes';

export const CALL_NOTE_TAGS = [
  'Spike opener worked',
  'Owner answered direct',
  'Storm angle landed',
  "Didn't recognize TwentyFour",
  'Competitor mentioned',
] as const;

export type CallNoteTag = (typeof CALL_NOTE_TAGS)[number];

/** Sub-outcomes that require scheduling a next contact date/time. */
export const SUB_OUTCOMES_NEED_DATE: SubOutcome[] = [
  'follow_up_requested',
  'booked_meeting',
  'decision_maker_unavailable',
];

export function subOutcomeNeedsDateTime(sub: SubOutcome): boolean {
  return sub === 'booked_meeting';
}

export function subOutcomeNeedsDateOnly(sub: SubOutcome): boolean {
  return sub === 'follow_up_requested' || sub === 'decision_maker_unavailable';
}

export type SaveCallOutcomeInput = {
  leadId: string;
  calledAt: string;
  durationSeconds: number;
  outcome: TopOutcome;
  subOutcome: SubOutcome | null;
  notes: string | null;
  tags: string[];
  sentimentScore: number | null;
  nextContactDate: string | null;
  openerVariantId: string | null;
};
