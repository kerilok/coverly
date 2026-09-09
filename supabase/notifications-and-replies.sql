-- Coverly: comment replies and notifications
-- Run once in Supabase SQL Editor.

alter table public.comments
  add column if not exists parent_id uuid references public.comments(id) on delete cascade;

create index if not exists comments_parent_id_idx on public.comments(parent_id);
create index if not exists comments_book_created_idx on public.comments(book_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  type text not null check (type in ('comment','reply')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "own notifications readable" on public.notifications;
create policy "own notifications readable" on public.notifications
for select using (user_id::text = auth.uid()::text);

drop policy if exists "own notifications update" on public.notifications;
create policy "own notifications update" on public.notifications
for update using (user_id::text = auth.uid()::text)
with check (user_id::text = auth.uid()::text);

drop policy if exists "own notifications delete" on public.notifications;
create policy "own notifications delete" on public.notifications
for delete using (user_id::text = auth.uid()::text);

create or replace function public.notify_about_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cover_owner uuid;
  parent_owner uuid;
begin
  select user_id into cover_owner from public.books where id = new.book_id;

  if new.parent_id is not null then
    select user_id into parent_owner from public.comments where id = new.parent_id;
  end if;

  if cover_owner is not null and cover_owner <> new.user_id then
    insert into public.notifications(user_id, actor_id, book_id, comment_id, type)
    values(
      cover_owner,
      new.user_id,
      new.book_id,
      new.id,
      case when parent_owner = cover_owner then 'reply' else 'comment' end
    );
  end if;

  if parent_owner is not null
     and parent_owner <> new.user_id
     and parent_owner is distinct from cover_owner then
    insert into public.notifications(user_id, actor_id, book_id, comment_id, type)
    values(parent_owner, new.user_id, new.book_id, new.id, 'reply');
  end if;

  return new;
end;
$$;

drop trigger if exists on_comment_notification on public.comments;
create trigger on_comment_notification
after insert on public.comments
for each row execute function public.notify_about_comment();

-- Match the uploader's 25 MB limit and allow converted/common image formats.
update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = null
where id = 'covers';
