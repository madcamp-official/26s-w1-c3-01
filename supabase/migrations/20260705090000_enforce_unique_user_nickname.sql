alter table public.users
  add constraint users_nickname_unique unique (nickname);
