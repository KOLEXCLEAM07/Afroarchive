-- =====================================================================
-- AfroArchive: corrections reports, moderation, image storage
-- Run after 20261009120000_security_hardening.sql. Idempotent.
--
-- To make yourself a moderator (run in the SQL editor):
--   update public.profiles set role = 'admin' where username = 'your_username';
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Role helper
-- ---------------------------------------------------------------------
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

revoke execute on function public.is_moderator() from public;
grant execute on function public.is_moderator() to anon, authenticated;


-- ---------------------------------------------------------------------
-- 2. Reports ("Report an error")
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  content_type  text not null check (content_type in ('article', 'record', 'collection', 'profile')),
  content_id    text not null check (char_length(content_id) between 1 and 200),
  content_title text check (content_title is null or char_length(content_title) <= 300),
  reason        text not null check (reason in ('factual_error', 'missing_source', 'copyright', 'offensive', 'off_topic', 'spam', 'other')),
  description   text check (description is null or char_length(description) <= 2000),
  status        text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  moderator_note text check (moderator_note is null or char_length(moderator_note) <= 1000),
  resolved_by   uuid references public.profiles(id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
create index if not exists reports_reporter_idx on public.reports(reporter_id);

alter table public.reports enable row level security;

drop policy if exists "Members file reports as themselves" on public.reports;
create policy "Members file reports as themselves" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'pending');

drop policy if exists "Reporters see their reports, moderators see all" on public.reports;
create policy "Reporters see their reports, moderators see all" on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_moderator()));

drop policy if exists "Moderators update reports" on public.reports;
create policy "Moderators update reports" on public.reports
  for update to authenticated
  using ((select public.is_moderator()))
  with check ((select public.is_moderator()));

-- Simple flood control: at most 10 reports per member per hour.
create or replace function public.limit_report_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.reports
      where reporter_id = new.reporter_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many reports. Please try again later.' using errcode = '54000';
  end if;
  return new;
end $$;

drop trigger if exists limit_report_rate on public.reports;
create trigger limit_report_rate
  before insert on public.reports
  for each row execute function public.limit_report_rate();


-- ---------------------------------------------------------------------
-- 3. Moderation of articles: moderators may change an article's status
--    (e.g. unpublish to 'under_review'). Engagement counters stay
--    protected by protect_article_columns.
-- ---------------------------------------------------------------------
drop policy if exists "Moderators can update articles" on public.articles;
create policy "Moderators can update articles" on public.articles
  for update to authenticated
  using ((select public.is_moderator()))
  with check ((select public.is_moderator()));

-- Authors cannot re-publish an article a moderator has taken down.
create or replace function public.keep_under_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'under_review'
     and new.status is distinct from 'under_review'
     and coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'authenticated'
     and not public.is_moderator() then
    new.status := 'under_review';
  end if;
  return new;
end $$;

drop trigger if exists keep_under_review on public.articles;
create trigger keep_under_review
  before update on public.articles
  for each row execute function public.keep_under_review();

drop policy if exists "Moderators can read all articles" on public.articles;
create policy "Moderators can read all articles" on public.articles
  for select to authenticated
  using ((select public.is_moderator()));


-- ---------------------------------------------------------------------
-- 4. Moderation of imported records: flag / restore.
--    Flagged records are hidden by the app.
-- ---------------------------------------------------------------------
create or replace function public.set_record_status(p_record_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can change record status' using errcode = '42501';
  end if;
  if p_status not in ('flagged', 'normalized', 'verified') then
    raise exception 'Invalid status';
  end if;
  execute format(
    'update public.knowledge_items set verification_status = %L, updated_at = now() where id = %L',
    p_status, p_record_id
  );
end $$;

revoke execute on function public.set_record_status(uuid, text) from public, anon;
grant execute on function public.set_record_status(uuid, text) to authenticated;


-- ---------------------------------------------------------------------
-- 5. Image storage. Public-read buckets; members can only write inside
--    a folder named after their own user id: <uid>/<file>.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',           'avatars',           true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('article-images',    'article-images',    true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('collection-covers', 'collection-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "AfroArchive images: owners upload" on storage.objects;
create policy "AfroArchive images: owners upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'article-images', 'collection-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "AfroArchive images: owners update" on storage.objects;
create policy "AfroArchive images: owners update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars', 'article-images', 'collection-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "AfroArchive images: owners delete" on storage.objects;
create policy "AfroArchive images: owners delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'article-images', 'collection-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );


-- ---------------------------------------------------------------------
-- 6. Data clean-up
-- ---------------------------------------------------------------------
-- "Tera people" and "Tangale people" are peoples, not kingdoms or states.
insert into public.cultures (name, knowledge_item_id)
select k.name, k.knowledge_item_id
from public.kingdoms_or_states k
where k.name in ('Tera people', 'Tangale people') and k.knowledge_item_id is not null
on conflict do nothing;

update public.knowledge_items
   set knowledge_type = 'culture'
 where id in (select knowledge_item_id from public.kingdoms_or_states
              where name in ('Tera people', 'Tangale people'));

delete from public.kingdoms_or_states where name in ('Tera people', 'Tangale people');

-- The seed source is the editorial desk, not an external website.
update public.sources
   set name = 'AfroArchive Editorial', base_url = null
 where slug = 'afroarchive-seed';
