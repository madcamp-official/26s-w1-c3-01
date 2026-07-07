create or replace function public.replace_user_preferences(
  p_user_id bigint,
  p_menu_preferences jsonb default '[]'::jsonb,
  p_category_preferences jsonb default '[]'::jsonb,
  p_tag_preferences jsonb default '[]'::jsonb,
  p_allergy_ids jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_menu_preferences where user_id = p_user_id;
  delete from public.user_category_preferences where user_id = p_user_id;
  delete from public.user_tag_preferences where user_id = p_user_id;
  delete from public.user_allergies where user_id = p_user_id;

  insert into public.user_menu_preferences (user_id, menu_id, preference_score, updated_at)
  select p_user_id, item.menu_id, item.preference_score, now()
  from jsonb_to_recordset(coalesce(p_menu_preferences, '[]'::jsonb)) as item(menu_id bigint, preference_score int);

  insert into public.user_category_preferences (user_id, category_id, preference_score, updated_at)
  select p_user_id, item.category_id, item.preference_score, now()
  from jsonb_to_recordset(coalesce(p_category_preferences, '[]'::jsonb)) as item(category_id bigint, preference_score int);

  insert into public.user_tag_preferences (user_id, tag_id, preference_score, updated_at)
  select p_user_id, item.tag_id, item.preference_score, now()
  from jsonb_to_recordset(coalesce(p_tag_preferences, '[]'::jsonb)) as item(tag_id bigint, preference_score int);

  insert into public.user_allergies (user_id, allergy_id)
  select p_user_id, value::bigint
  from jsonb_array_elements_text(coalesce(p_allergy_ids, '[]'::jsonb));
end;
$$;

create or replace view public.menu_rating_stats as
select
  ratings.menu_id,
  avg(ratings.rating)::double precision as rating_average,
  count(*)::bigint as rating_count
from (
  select reviews.menu_id, reviews.rating
  from public.reviews
  union all
  select meal_history.menu_id, meal_history.rating
  from public.meal_history
  where meal_history.rating is not null
) ratings
group by ratings.menu_id;

create or replace view public.menu_popularity_stats as
select
  user_menu_interactions.menu_id,
  sum(
    case user_menu_interactions.interaction_type
      when 'pick' then 1.0
      when 'like' then 0.7
      when 'bookmark' then 0.5
      when 'view' then 0.2
      else 0.0
    end
  )::double precision as popularity_raw
from public.user_menu_interactions
where user_menu_interactions.interaction_type in ('pick', 'like', 'bookmark', 'view')
group by user_menu_interactions.menu_id;

create index if not exists meeting_participants_user_id_idx
  on public.meeting_participants(user_id);
create index if not exists menu_tags_tag_id_menu_id_idx
  on public.menu_tags(tag_id, menu_id);
create index if not exists menu_allergies_allergy_id_menu_id_idx
  on public.menu_allergies(allergy_id, menu_id);
create index if not exists menu_purpose_suitability_purpose_menu_idx
  on public.menu_purpose_suitability(meeting_purpose_id, menu_id);
create index if not exists meeting_recommendations_menu_run_idx
  on public.meeting_recommendations(menu_id, run_id);

create or replace function public.set_menu_interaction_state(
  p_user_id bigint,
  p_menu_id bigint,
  p_interaction_type text,
  p_selected boolean
)
returns table(menu_id bigint, preference text, bookmarked boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_interaction_type not in ('like', 'dislike', 'bookmark') then
    raise exception 'Unsupported interaction type: %', p_interaction_type
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.menus where menus.menu_id = p_menu_id) then
    raise exception 'Menu not found: %', p_menu_id
      using errcode = 'P0002';
  end if;

  if p_interaction_type in ('like', 'dislike') then
    delete from public.user_menu_interactions
    where user_id = p_user_id
      and menu_id = p_menu_id
      and interaction_type = case when p_interaction_type = 'like' then 'dislike' else 'like' end;
  end if;

  if not p_selected then
    delete from public.user_menu_interactions
    where user_id = p_user_id
      and menu_id = p_menu_id
      and interaction_type = p_interaction_type;
  else
    insert into public.user_menu_interactions (user_id, menu_id, interaction_type)
    values (p_user_id, p_menu_id, p_interaction_type)
    on conflict do nothing;
  end if;

  return query
  select
    p_menu_id,
    (
      select umi.interaction_type
      from public.user_menu_interactions umi
      where umi.user_id = p_user_id
        and umi.menu_id = p_menu_id
        and umi.interaction_type in ('like', 'dislike')
      order by umi.created_at desc, umi.interaction_id desc
      limit 1
    )::text,
    exists (
      select 1
      from public.user_menu_interactions umi
      where umi.user_id = p_user_id
        and umi.menu_id = p_menu_id
        and umi.interaction_type = 'bookmark'
    );
end;
$$;

revoke all on function public.replace_user_preferences(bigint, jsonb, jsonb, jsonb, jsonb) from public;
revoke all on function public.set_menu_interaction_state(bigint, bigint, text, boolean) from public;
grant execute on function public.replace_user_preferences(bigint, jsonb, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.set_menu_interaction_state(bigint, bigint, text, boolean) to service_role;
grant select on public.menu_rating_stats to service_role;
grant select on public.menu_popularity_stats to service_role;
