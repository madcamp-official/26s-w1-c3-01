drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
on public.users for insert
to authenticated
with check ((select auth.uid()) = auth_user_id);

drop policy if exists "Service role can manage profiles" on public.users;
create policy "Service role can manage profiles"
on public.users for all
to service_role
using (true)
with check (true);
