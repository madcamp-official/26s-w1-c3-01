begin;

insert into public.menu_categories (name) values
  ('한식'),
  ('중식'),
  ('양식'),
  ('일식'),
  ('아시안'),
  ('고기'),
  ('패스트푸드')
on conflict (name) do nothing;

with category_name_mappings(old_name, new_name) as (
  values
    ('분식', '한식'),
    ('건강식', '양식'),
    ('동남아식', '아시안')
)
insert into public.user_category_preferences (
  user_id,
  category_id,
  preference_score,
  updated_at
)
select ucp.user_id, new_category.category_id, ucp.preference_score, now()
from public.user_category_preferences ucp
join public.menu_categories old_category
  on old_category.category_id = ucp.category_id
join category_name_mappings mapping
  on mapping.old_name = old_category.name
join public.menu_categories new_category
  on new_category.name = mapping.new_name
on conflict (user_id, category_id) do update
set preference_score = excluded.preference_score,
    updated_at = now();

delete from public.user_category_preferences ucp
using public.menu_categories c
where ucp.category_id = c.category_id
  and c.name in ('분식', '건강식', '동남아식');

with menu_category_pairs(menu_name, category_name) as (
  values
    ('김치찌개', '한식'),
    ('비빔밥', '한식'),
    ('제육볶음', '고기'),
    ('짜장면', '중식'),
    ('마라탕', '중식'),
    ('초밥', '일식'),
    ('라멘', '일식'),
    ('파스타', '양식'),
    ('샐러드볼', '양식'),
    ('쌀국수', '아시안')
)
update public.menus m
set category_id = c.category_id,
    description = case
      when m.name = '쌀국수' then '가벼우면서도 따뜻한 국물 중심의 아시안 메뉴'
      else m.description
    end
from menu_category_pairs p
join public.menu_categories c on c.name = p.category_name
where m.name = p.menu_name;

delete from public.menu_categories
where name not in ('한식', '중식', '양식', '일식', '아시안', '고기', '패스트푸드');

insert into public.tags (name) values
  ('구이'),
  ('국물'),
  ('조림'),
  ('찜'),
  ('삶음'),
  ('볶음'),
  ('튀김'),
  ('날것'),
  ('매운맛')
on conflict (name) do nothing;

delete from public.menu_tags
where menu_id in (
  select menu_id
  from public.menus
  where name in (
    '김치찌개',
    '비빔밥',
    '제육볶음',
    '짜장면',
    '마라탕',
    '초밥',
    '라멘',
    '파스타',
    '샐러드볼',
    '쌀국수'
  )
);

delete from public.user_tag_preferences utp
using public.tags t
where utp.tag_id = t.tag_id
  and t.name not in ('구이', '국물', '조림', '찜', '삶음', '볶음', '튀김', '날것', '매운맛');

with menu_tag_pairs(menu_name, tag_name) as (
  values
    ('김치찌개', '국물'),
    ('김치찌개', '조림'),
    ('김치찌개', '매운맛'),
    ('비빔밥', '삶음'),
    ('비빔밥', '매운맛'),
    ('제육볶음', '볶음'),
    ('제육볶음', '매운맛'),
    ('짜장면', '볶음'),
    ('짜장면', '삶음'),
    ('마라탕', '국물'),
    ('마라탕', '삶음'),
    ('마라탕', '매운맛'),
    ('초밥', '날것'),
    ('라멘', '국물'),
    ('라멘', '삶음'),
    ('파스타', '볶음'),
    ('파스타', '삶음'),
    ('샐러드볼', '날것'),
    ('샐러드볼', '삶음'),
    ('쌀국수', '국물'),
    ('쌀국수', '삶음')
)
insert into public.menu_tags (menu_id, tag_id)
select m.menu_id, t.tag_id
from menu_tag_pairs p
join public.menus m on m.name = p.menu_name
join public.tags t on t.name = p.tag_name
on conflict do nothing;

delete from public.tags
where name not in ('구이', '국물', '조림', '찜', '삶음', '볶음', '튀김', '날것', '매운맛');

commit;
