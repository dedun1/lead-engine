-- P19: extended call outcome fields for forced outcome modal + lead quick filters

alter table public.call_attempts
  add column if not exists sub_outcome text,
  add column if not exists tags jsonb,
  add column if not exists sentiment_score int,
  add column if not exists next_contact_date timestamptz;

alter table public.call_attempts
  drop constraint if exists call_attempts_sub_outcome_check;

alter table public.call_attempts
  add constraint call_attempts_sub_outcome_check check (
    sub_outcome is null or sub_outcome in (
      'interested',
      'not_interested',
      'follow_up_requested',
      'booked_meeting',
      'price_objection',
      'already_has_solution',
      'decision_maker_unavailable',
      'hostile',
      'dnc_requested'
    )
  );

alter table public.call_attempts
  drop constraint if exists call_attempts_sentiment_score_check;

alter table public.call_attempts
  add constraint call_attempts_sentiment_score_check check (
    sentiment_score is null or sentiment_score between -2 and 2
  );

alter table public.leads
  add column if not exists last_outcome text;
