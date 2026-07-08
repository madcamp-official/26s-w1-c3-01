truncate table public.menu_tags;

insert into public.menu_tags(menu_id, tag_id)
with desired as (
  select m.menu_id,
    case
      when m.description like '%국물%' then '국물'
      when m.description like '%구워%' then '구이'
      when m.description like '%조림%' then '조림'
      when m.description like '%찜%' then '찜'
      when m.description like '%삶%' then '삶음'
      when m.description like '%볶%' then '볶음'
      when m.description like '%튀김%' then '튀김'
      when m.description like '%날것%' then '날것'
      else '볶음'
    end as cooking_tag_name,
    (m.spicy_level >= 3 or m.description like '%매운맛%') as is_spicy
  from public.menus m
)
select d.menu_id, t.tag_id
from desired d
join public.tags t on t.name = d.cooking_tag_name
union
select d.menu_id, t.tag_id
from desired d
join public.tags t on t.name = '매운맛'
where d.is_spicy
on conflict do nothing;
