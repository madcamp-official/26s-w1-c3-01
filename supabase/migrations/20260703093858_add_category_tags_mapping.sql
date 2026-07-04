begin;

create table if not exists public.category_tags (
  category_id bigint not null references public.menu_categories(category_id) on delete cascade,
  tag_id bigint not null references public.tags(tag_id) on delete cascade,
  primary key (category_id, tag_id)
);

create index if not exists category_tags_tag_id_idx on public.category_tags(tag_id);

grant select on public.category_tags to authenticated;

alter table public.category_tags enable row level security;

drop policy if exists "Authenticated users can read category tags" on public.category_tags;
create policy "Authenticated users can read category tags"
on public.category_tags for select
to authenticated
using (true);

delete from public.category_tags;

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

commit;
