insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ui-assets',
  'ui-assets',
  true,
  10485760,
  array['image/png']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read access for ui-assets" on storage.objects;

create policy "Public read access for ui-assets"
on storage.objects
for select
to public
using (bucket_id = 'ui-assets');
