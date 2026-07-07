alter table public.meeting_recommendations
  add column if not exists scores_json jsonb;
