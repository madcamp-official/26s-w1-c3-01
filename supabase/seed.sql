insert into public.menu_categories (name) values
  ('한식'),
  ('중식'),
  ('양식'),
  ('일식'),
  ('아시안'),
  ('고기'),
  ('패스트푸드')
on conflict (name) do nothing;

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

with category_tag_pairs(category_name, tag_name) as (
  values
    ('한식', '구이'),
    ('한식', '국물'),
    ('한식', '조림'),
    ('한식', '찜'),
    ('한식', '삶음'),
    ('한식', '볶음'),
    ('한식', '튀김'),
    ('한식', '날것'),
    ('한식', '매운맛'),
    ('중식', '구이'),
    ('중식', '국물'),
    ('중식', '조림'),
    ('중식', '찜'),
    ('중식', '삶음'),
    ('중식', '볶음'),
    ('중식', '튀김'),
    ('중식', '매운맛'),
    ('양식', '구이'),
    ('양식', '국물'),
    ('양식', '조림'),
    ('양식', '찜'),
    ('양식', '삶음'),
    ('양식', '볶음'),
    ('양식', '튀김'),
    ('양식', '날것'),
    ('양식', '매운맛'),
    ('일식', '구이'),
    ('일식', '국물'),
    ('일식', '조림'),
    ('일식', '찜'),
    ('일식', '삶음'),
    ('일식', '볶음'),
    ('일식', '튀김'),
    ('일식', '날것'),
    ('일식', '매운맛'),
    ('아시안', '구이'),
    ('아시안', '국물'),
    ('아시안', '찜'),
    ('아시안', '삶음'),
    ('아시안', '볶음'),
    ('아시안', '튀김'),
    ('아시안', '날것'),
    ('아시안', '매운맛'),
    ('고기', '구이'),
    ('고기', '조림'),
    ('고기', '찜'),
    ('고기', '삶음'),
    ('고기', '볶음'),
    ('고기', '튀김'),
    ('고기', '날것'),
    ('고기', '매운맛'),
    ('패스트푸드', '구이'),
    ('패스트푸드', '볶음'),
    ('패스트푸드', '튀김'),
    ('패스트푸드', '매운맛')
)
insert into public.category_tags (category_id, tag_id)
select c.category_id, t.tag_id
from category_tag_pairs p
join public.menu_categories c on c.name = p.category_name
join public.tags t on t.name = p.tag_name
on conflict do nothing;

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

insert into public.meeting_purposes (name) values
  ('가벼운 식사'),
  ('든든한 식사'),
  ('회식'),
  ('데이트'),
  ('팀플 식사'),
  ('새로운 메뉴 시도'),
  ('건강식')
on conflict (name) do nothing;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '김치찌개', '매콤한 국물 중심의 대표 한식 메뉴', 3, 2, 650
from public.menu_categories where name = '한식'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '비빔밥', '여러 재료를 한 그릇에 섞어 먹는 균형 잡힌 한식', 1, 2, 600
from public.menu_categories where name = '한식'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '제육볶음', '매콤한 돼지고기 볶음 메뉴', 4, 2, 800
from public.menu_categories where name = '고기'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '짜장면', '중식 면 요리의 기본 선택지', 0, 2, 750
from public.menu_categories where name = '중식'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '마라탕', '재료를 고르고 매운맛을 조절할 수 있는 중식 메뉴', 5, 3, 900
from public.menu_categories where name = '중식'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '초밥', '가벼운 모임과 데이트에 적합한 일식 메뉴', 0, 4, 550
from public.menu_categories where name = '일식'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '라멘', '진한 국물과 면이 중심인 일식 메뉴', 1, 3, 780
from public.menu_categories where name = '일식'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '파스타', '호불호가 적고 데이트에 적합한 양식 메뉴', 0, 3, 700
from public.menu_categories where name = '양식'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '샐러드볼', '가벼운 식사와 건강식 목적에 적합한 메뉴', 0, 3, 430
from public.menu_categories where name = '양식'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

insert into public.menus (category_id, name, description, spicy_level, price_level, calorie)
select category_id, '쌀국수', '가벼우면서도 따뜻한 국물 중심의 아시안 메뉴', 0, 2, 520
from public.menu_categories where name = '아시안'
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  spicy_level = excluded.spicy_level,
  price_level = excluded.price_level,
  calorie = excluded.calorie;

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

with purpose_scores(menu_name, purpose_name, score) as (
  values
    ('김치찌개', '든든한 식사', 5),
    ('김치찌개', '팀플 식사', 4),
    ('비빔밥', '건강식', 4),
    ('비빔밥', '가벼운 식사', 4),
    ('제육볶음', '든든한 식사', 5),
    ('제육볶음', '팀플 식사', 4),
    ('짜장면', '가벼운 식사', 3),
    ('짜장면', '팀플 식사', 3),
    ('마라탕', '새로운 메뉴 시도', 5),
    ('마라탕', '회식', 4),
    ('초밥', '데이트', 5),
    ('초밥', '가벼운 식사', 4),
    ('라멘', '든든한 식사', 4),
    ('라멘', '가벼운 식사', 3),
    ('파스타', '데이트', 5),
    ('파스타', '팀플 식사', 4),
    ('샐러드볼', '건강식', 5),
    ('샐러드볼', '가벼운 식사', 5),
    ('쌀국수', '가벼운 식사', 4),
    ('쌀국수', '새로운 메뉴 시도', 4)
)
insert into public.menu_purpose_suitability (menu_id, meeting_purpose_id, suitability_score)
select m.menu_id, mp.meeting_purpose_id, p.score
from purpose_scores p
join public.menus m on m.name = p.menu_name
join public.meeting_purposes mp on mp.name = p.purpose_name
on conflict (menu_id, meeting_purpose_id) do update set
  suitability_score = excluded.suitability_score;
