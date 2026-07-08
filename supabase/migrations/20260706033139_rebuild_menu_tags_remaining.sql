do $$
begin
  if to_regclass('public.tmp_desired_menu_tags') is not null then
    insert into public.menu_tags(menu_id, tag_id)
    select d.menu_id, d.tag_id
    from public.tmp_desired_menu_tags d
    on conflict do nothing;
  end if;
end;
$$;
