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

create or replace function private.handle_confirmed_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  is_confirmed boolean := coalesce(new.email_confirmed_at, new.confirmed_at) is not null;
  nickname_base text;
begin
  if not is_confirmed then
    return new;
  end if;

  nickname_base := coalesce(
    new.raw_user_meta_data ->> 'nickname',
    'user-' || left(new.id::text, 8)
  );

  insert into public.users (auth_user_id, email, nickname, user_type)
  values (
    new.id,
    coalesce(new.email, ''),
    private.make_unique_user_nickname(nickname_base),
    coalesce(new.raw_user_meta_data ->> 'user_type', 'PERSONAL')
  )
  on conflict (auth_user_id) do update
    set email = excluded.email,
        user_type = excluded.user_type,
        updated_at = now();

  return new;
end;
$$;

revoke all on function private.handle_confirmed_auth_user() from public;
revoke all on function private.handle_confirmed_auth_user() from anon;
revoke all on function private.handle_confirmed_auth_user() from authenticated;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_confirmed on auth.users;

create trigger on_auth_user_confirmed
after insert or update of email_confirmed_at, confirmed_at, email, raw_user_meta_data on auth.users
for each row execute function private.handle_confirmed_auth_user();

insert into public.users (auth_user_id, email, nickname, user_type)
select
  au.id,
  coalesce(au.email, ''),
  private.make_unique_user_nickname(
    coalesce(au.raw_user_meta_data ->> 'nickname', 'user-' || left(au.id::text, 8))
  ),
  coalesce(au.raw_user_meta_data ->> 'user_type', 'PERSONAL')
from auth.users au
where coalesce(au.email_confirmed_at, au.confirmed_at) is not null
  and not exists (
    select 1
    from public.users pu
    where pu.auth_user_id = au.id
  );

delete from public.users pu
using auth.users au
where pu.auth_user_id = au.id
  and coalesce(au.email_confirmed_at, au.confirmed_at) is null
  and coalesce(pu.user_type, '') <> 'GUEST';
