-- Coverly: profile avatars and custom username colors
-- Run once in Supabase SQL Editor.

alter table public.users
  add column if not exists username_color text not null default '#a78bfa';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'avatars',
  'avatars',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict(id) do update set
  public=true,
  file_size_limit=10485760,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif','image/avif'];

drop policy if exists "public avatar read" on storage.objects;
create policy "public avatar read" on storage.objects
for select using(bucket_id='avatars');

drop policy if exists "own avatar upload" on storage.objects;
create policy "own avatar upload" on storage.objects
for insert to authenticated
with check(
  bucket_id='avatars'
  and (storage.foldername(name))[1]::text=auth.uid()::text
);

drop policy if exists "own avatar update" on storage.objects;
create policy "own avatar update" on storage.objects
for update to authenticated
using(
  bucket_id='avatars'
  and owner_id::text=auth.uid()::text
)
with check(
  bucket_id='avatars'
  and (storage.foldername(name))[1]::text=auth.uid()::text
);

drop policy if exists "own avatar delete" on storage.objects;
create policy "own avatar delete" on storage.objects
for delete to authenticated
using(
  bucket_id='avatars'
  and owner_id::text=auth.uid()::text
);
