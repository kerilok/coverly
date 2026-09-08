create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 2 and 32),
  avatar text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(), title text not null, author text not null,
  description text, cover_url text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now()
);
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 10),
  created_at timestamptz default now(), unique(book_id,user_id)
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null, created_at timestamptz default now()
);

alter table public.users add column if not exists role text not null default 'user';

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.users(id,username)
  values(new.id,coalesce(nullif(new.raw_user_meta_data->>'username',''),'user_'||substr(new.id::text,1,8)))
  on conflict(id) do nothing;
  return new;
end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.ratings enable row level security;
alter table public.comments enable row level security;

drop policy if exists "profiles readable" on public.users;
create policy "profiles readable" on public.users for select using(true);
drop policy if exists "own profile update" on public.users;
create policy "own profile update" on public.users for update using(id::text=auth.uid()::text);

drop policy if exists "books readable" on public.books;
create policy "books readable" on public.books for select using(true);
drop policy if exists "owners create books" on public.books;
create policy "owners create books" on public.books for insert with check(user_id::text=auth.uid()::text);
drop policy if exists "owners delete books" on public.books;
create policy "owners delete books" on public.books for delete using(
  user_id::text=auth.uid()::text or exists(
    select 1 from public.users where id::text=auth.uid()::text and role='admin'
  )
);

drop policy if exists "ratings readable" on public.ratings;
create policy "ratings readable" on public.ratings for select using(true);
drop policy if exists "own rating" on public.ratings;
create policy "own rating" on public.ratings for all
using(user_id::text=auth.uid()::text) with check(user_id::text=auth.uid()::text);

drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments for select using(true);
drop policy if exists "own comments" on public.comments;
create policy "own comments" on public.comments for insert with check(user_id::text=auth.uid()::text);
drop policy if exists "owner or admin deletes comments" on public.comments;
create policy "owner or admin deletes comments" on public.comments for delete using(
  user_id::text=auth.uid()::text or exists(
    select 1 from public.users where id::text=auth.uid()::text and role='admin'
  )
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('covers','covers',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true;

drop policy if exists "public cover read" on storage.objects;
create policy "public cover read" on storage.objects for select using(bucket_id='covers');
drop policy if exists "authenticated cover upload" on storage.objects;
create policy "authenticated cover upload" on storage.objects for insert to authenticated
with check(bucket_id='covers' and (storage.foldername(name))[1]::text=auth.uid()::text);
drop policy if exists "owner cover delete" on storage.objects;
create policy "owner cover delete" on storage.objects for delete to authenticated
using(bucket_id='covers' and owner_id::text=auth.uid()::text);
