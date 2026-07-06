delete from public.user_menu_interactions older
where older.interaction_type in ('like', 'dislike', 'bookmark')
  and exists (
    select 1
    from public.user_menu_interactions newer
    where newer.user_id = older.user_id
      and newer.menu_id = older.menu_id
      and newer.interaction_type = older.interaction_type
      and (
        newer.created_at > older.created_at
        or (
          newer.created_at = older.created_at
          and newer.interaction_id > older.interaction_id
        )
      )
  );

create unique index if not exists user_menu_interactions_unique_toggle_idx
  on public.user_menu_interactions(user_id, menu_id, interaction_type)
  where interaction_type in ('like', 'dislike', 'bookmark');
