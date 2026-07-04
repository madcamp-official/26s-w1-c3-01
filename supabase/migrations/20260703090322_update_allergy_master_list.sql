begin;

insert into public.allergies (name) values
  ('알류'),
  ('우유'),
  ('메밀'),
  ('땅콩'),
  ('대두'),
  ('밀'),
  ('잣'),
  ('호두'),
  ('게'),
  ('새우'),
  ('오징어'),
  ('고등어'),
  ('조개류'),
  ('복숭아'),
  ('토마토'),
  ('닭고기'),
  ('돼지고기'),
  ('쇠고기'),
  ('아황산류')
on conflict (name) do nothing;

with user_allergy_name_mappings(old_name, new_name) as (
  values
    ('계란', '알류'),
    ('밀가루', '밀'),
    ('갑각류', '게'),
    ('갑각류', '새우'),
    ('해산물', '게'),
    ('해산물', '새우'),
    ('해산물', '오징어'),
    ('해산물', '고등어'),
    ('해산물', '조개류')
)
insert into public.user_allergies (user_id, allergy_id)
select ua.user_id, new_allergy.allergy_id
from public.user_allergies ua
join public.allergies old_allergy on old_allergy.allergy_id = ua.allergy_id
join user_allergy_name_mappings mapping on mapping.old_name = old_allergy.name
join public.allergies new_allergy on new_allergy.name = mapping.new_name
on conflict do nothing;

delete from public.user_allergies ua
using public.allergies a
where ua.allergy_id = a.allergy_id
  and a.name in ('계란', '밀가루', '갑각류', '해산물');

delete from public.menu_allergies
where menu_id in (
  select menu_id
  from public.menus
  where name in (
    '제육볶음',
    '짜장면',
    '마라탕',
    '초밥',
    '라멘',
    '파스타',
    '쌀국수'
  )
);

with menu_allergy_pairs(menu_name, allergy_name) as (
  values
    ('제육볶음', '돼지고기'),
    ('짜장면', '밀'),
    ('짜장면', '대두'),
    ('마라탕', '땅콩'),
    ('마라탕', '대두'),
    ('초밥', '게'),
    ('초밥', '새우'),
    ('초밥', '오징어'),
    ('초밥', '고등어'),
    ('초밥', '조개류'),
    ('라멘', '밀'),
    ('라멘', '대두'),
    ('파스타', '밀'),
    ('파스타', '우유'),
    ('쌀국수', '새우'),
    ('쌀국수', '조개류')
)
insert into public.menu_allergies (menu_id, allergy_id)
select m.menu_id, a.allergy_id
from menu_allergy_pairs p
join public.menus m on m.name = p.menu_name
join public.allergies a on a.name = p.allergy_name
on conflict do nothing;

delete from public.allergies
where name in ('계란', '밀가루', '갑각류', '해산물');

commit;
