update public.user_menu_preferences
set preference_score = 0
where preference_score < 0;

update public.user_category_preferences
set preference_score = 0
where preference_score < 0;

update public.user_tag_preferences
set preference_score = 0
where preference_score < 0;

alter table public.user_menu_preferences
  drop constraint if exists user_menu_preferences_preference_score_check;

alter table public.user_menu_preferences
  add constraint user_menu_preferences_preference_score_check
  check (preference_score between 0 and 5);

alter table public.user_category_preferences
  drop constraint if exists user_category_preferences_preference_score_check;

alter table public.user_category_preferences
  add constraint user_category_preferences_preference_score_check
  check (preference_score between 0 and 5);

alter table public.user_tag_preferences
  drop constraint if exists user_tag_preferences_preference_score_check;

alter table public.user_tag_preferences
  add constraint user_tag_preferences_preference_score_check
  check (preference_score between 0 and 5);

create or replace view public.menu_recommendation_features
with (security_invoker = true)
as
select
  m.menu_id,
  m.category_id,
  mc.name as category_name,
  m.name,
  m.description,
  m.spicy_level,
  m.price_level,
  m.calorie,
  coalesce(
    array_agg(distinct mt.tag_id) filter (where mt.tag_id is not null),
    '{}'::bigint[]
  ) as tag_ids,
  coalesce(
    array_agg(distinct ma.allergy_id) filter (where ma.allergy_id is not null),
    '{}'::bigint[]
  ) as allergy_ids
from public.menus m
left join public.menu_categories mc
  on mc.category_id = m.category_id
left join public.menu_tags mt
  on mt.menu_id = m.menu_id
left join public.menu_allergies ma
  on ma.menu_id = m.menu_id
group by
  m.menu_id,
  m.category_id,
  mc.name,
  m.name,
  m.description,
  m.spicy_level,
  m.price_level,
  m.calorie;
