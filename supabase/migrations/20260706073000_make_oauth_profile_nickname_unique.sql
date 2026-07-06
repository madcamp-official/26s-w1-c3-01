create or replace function private.make_unique_user_nickname(base_nickname text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := left(nullif(trim(base_nickname), ''), 50);
  candidate text;
  suffix text;
  attempt int := 0;
begin
  if normalized is null then
    normalized := 'user';
  end if;

  loop
    suffix := case when attempt = 0 then '' else '-' || (attempt + 1)::text end;
    candidate := left(normalized, 50 - length(suffix)) || suffix;

    if not exists (select 1 from public.users where nickname = candidate) then
      return candidate;
    end if;

    attempt := attempt + 1;

    if attempt >= 20 then
      return left('user-' || extract(epoch from clock_timestamp())::bigint::text, 50);
    end if;
  end loop;
end;
$$;

revoke all on function private.make_unique_user_nickname(text) from public;
revoke all on function private.make_unique_user_nickname(text) from anon;
revoke all on function private.make_unique_user_nickname(text) from authenticated;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (auth_user_id, email, nickname, user_type)
  values (
    new.id,
    coalesce(new.email, ''),
    private.make_unique_user_nickname(
      coalesce(new.raw_user_meta_data ->> 'nickname', split_part(coalesce(new.email, 'user'), '@', 1))
    ),
    coalesce(new.raw_user_meta_data ->> 'user_type', 'PERSONAL')
  )
  on conflict (auth_user_id) do update
    set email = excluded.email,
        user_type = excluded.user_type,
        updated_at = now();

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public;
revoke all on function private.handle_new_auth_user() from anon;
revoke all on function private.handle_new_auth_user() from authenticated;
