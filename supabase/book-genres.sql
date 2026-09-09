-- Coverly: genres for published covers
-- Run once in Supabase SQL Editor.

alter table public.books
  add column if not exists genre text not null default 'other';

create index if not exists books_genre_created_idx
  on public.books(genre, created_at desc);
