-- P14: opener variant metadata + lead's active opener selection

alter table public.pitch_opener_variants
  add column if not exists hook_type text,
  add column if not exists personalization_signals_used jsonb,
  add column if not exists predicted_open_rate numeric,
  add column if not exists is_edited boolean default false;

alter table public.pitch_opener_variants
  drop constraint if exists pitch_opener_variants_hook_type_check;

alter table public.pitch_opener_variants
  add constraint pitch_opener_variants_hook_type_check check (
    hook_type is null or hook_type in (
      'review_velocity',
      'storm_aftermath',
      'rating_anchor',
      'local_pride',
      'generic_pain_point'
    )
  );

alter table public.leads
  add column if not exists current_opener_variant_id uuid
    references public.pitch_opener_variants(id);
