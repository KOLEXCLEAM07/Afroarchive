-- =====================================================================
-- AfroArchive: security & data-integrity hardening
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: every statement is idempotent.
--
-- Before running, you can review existing policies with:
--   select tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname = 'public' order by tablename;
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Ingestion RPCs must not be callable from the browser.
--    They are SECURITY DEFINER and were executable by `anon`, which let
--    anyone on the internet create/overwrite knowledge_items.
--    Ingestion scripts must now use SUPABASE_SERVICE_ROLE_KEY.
-- ---------------------------------------------------------------------
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'start_ingestion_run_rpc',
        'finish_ingestion_run_rpc',
        'upsert_knowledge_item_rpc',
        'log_ingestion_error_rpc'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn.sig);
    execute format('grant execute on function %s to service_role', fn.sig);
  end loop;
end $$;


-- ---------------------------------------------------------------------
-- 2. Users may edit their own profile, but never their role,
--    verification badge or counters.
--    Direct API calls run as `authenticated`/`anon`; SECURITY DEFINER
--    functions and the dashboard run as the table owner, so they are
--    unaffected.
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.id              := old.id;
    new.role            := old.role;
    new.is_verified     := old.is_verified;
    new.followers_count := old.followers_count;
    new.following_count := old.following_count;
    new.articles_count  := old.articles_count;
    new.total_views     := old.total_views;
    new.created_at      := old.created_at;
    new.updated_at      := now();
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();


-- ---------------------------------------------------------------------
-- 3. Authors control their writing, not engagement numbers.
--    Also makes published_at server-managed: set on first publish,
--    preserved on later edits.
-- ---------------------------------------------------------------------
create or replace function public.protect_article_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.views_count     := 0;
      new.likes_count     := 0;
      new.comments_count  := 0;
      new.bookmarks_count := 0;
      new.is_featured     := false;
      new.created_at      := now();
    else
      new.author_id       := old.author_id;
      new.views_count     := old.views_count;
      new.likes_count     := old.likes_count;
      new.comments_count  := old.comments_count;
      new.bookmarks_count := old.bookmarks_count;
      new.is_featured     := old.is_featured;
      new.created_at      := old.created_at;
    end if;
    new.updated_at := now();
  end if;

  if new.status = 'published' then
    if tg_op = 'UPDATE' and old.published_at is not null then
      new.published_at := old.published_at;
    else
      new.published_at := coalesce(new.published_at, now());
    end if;
  elsif tg_op = 'UPDATE' then
    new.published_at := old.published_at;
  end if;

  return new;
end $$;

drop trigger if exists protect_article_columns on public.articles;
create trigger protect_article_columns
  before insert or update on public.articles
  for each row execute function public.protect_article_columns();


-- ---------------------------------------------------------------------
-- 4. Server-side validation.
--    NOT VALID = enforced for new/edited rows without failing on
--    existing data (e.g. the published article titled "..").
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'articles_title_length') then
    alter table public.articles add constraint articles_title_length
      check (char_length(btrim(title)) between 5 and 200) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'articles_slug_format') then
    alter table public.articles add constraint articles_slug_format
      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'articles_published_content_length') then
    alter table public.articles add constraint articles_published_content_length
      check (status is distinct from 'published' or char_length(btrim(content)) >= 300) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'articles_excerpt_length') then
    alter table public.articles add constraint articles_excerpt_length
      check (excerpt is null or char_length(excerpt) <= 400) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'articles_cover_image_url') then
    alter table public.articles add constraint articles_cover_image_url
      check (cover_image is null or cover_image ~* '^https://') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_username_format') then
    alter table public.profiles add constraint profiles_username_format
      check (username ~ '^[a-z0-9_]{3,30}$') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_bio_length') then
    alter table public.profiles add constraint profiles_bio_length
      check (bio is null or char_length(bio) <= 500) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_url_schemes') then
    alter table public.profiles add constraint profiles_url_schemes
      check (
        (website    is null or website    ~* '^https?://') and
        (avatar_url is null or avatar_url ~* '^https://') and
        (cover_url  is null or cover_url  ~* '^https://')
      ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'collections_title_length') then
    alter table public.collections add constraint collections_title_length
      check (char_length(btrim(title)) between 3 and 120) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'collections_cover_image_url') then
    alter table public.collections add constraint collections_cover_image_url
      check (cover_image is null or cover_image ~* '^https://') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'comments_content_length') then
    alter table public.comments add constraint comments_content_length
      check (char_length(btrim(content)) between 1 and 5000) not valid;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 5. Counters are maintained by the database, not the browser.
-- ---------------------------------------------------------------------
create or replace function public.refresh_article_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  authors    uuid[] := array[]::uuid[];
  categories uuid[] := array[]::uuid[];
begin
  if tg_op in ('INSERT', 'UPDATE') then
    authors    := authors    || new.author_id;
    categories := categories || new.category_id;
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    authors    := authors    || old.author_id;
    categories := categories || old.category_id;
  end if;

  update public.profiles p
     set articles_count = (select count(*) from public.articles a
                           where a.author_id = p.id and a.status = 'published')
   where p.id = any(authors);

  update public.categories c
     set articles_count = (select count(*) from public.articles a
                           where a.category_id = c.id and a.status = 'published')
   where c.id = any(categories);

  return null;
end $$;

drop trigger if exists refresh_article_counters on public.articles;
create trigger refresh_article_counters
  after insert or update of status, author_id, category_id or delete on public.articles
  for each row execute function public.refresh_article_counters();

-- one-off resync of existing counters
update public.profiles p
   set articles_count = (select count(*) from public.articles a
                         where a.author_id = p.id and a.status = 'published');
update public.categories c
   set articles_count = (select count(*) from public.articles a
                         where a.category_id = c.id and a.status = 'published');


-- ---------------------------------------------------------------------
-- 6. Real likes (the like button previously only changed local state).
-- ---------------------------------------------------------------------
create table if not exists public.article_likes (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);
create index if not exists article_likes_user_id_idx on public.article_likes(user_id);

alter table public.article_likes enable row level security;

drop policy if exists "Likes are public" on public.article_likes;
create policy "Likes are public" on public.article_likes
  for select using (true);

drop policy if exists "Users like as themselves" on public.article_likes;
create policy "Users like as themselves" on public.article_likes
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users remove their own likes" on public.article_likes;
create policy "Users remove their own likes" on public.article_likes
  for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.refresh_article_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare target uuid := coalesce(new.article_id, old.article_id);
begin
  update public.articles
     set likes_count = (select count(*) from public.article_likes where article_id = target)
   where id = target;
  return null;
end $$;

drop trigger if exists refresh_article_likes_count on public.article_likes;
create trigger refresh_article_likes_count
  after insert or delete on public.article_likes
  for each row execute function public.refresh_article_likes_count();


-- ---------------------------------------------------------------------
-- 7. View counting through a narrow function instead of open UPDATEs.
-- ---------------------------------------------------------------------
create or replace function public.increment_article_views(p_article_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.articles
     set views_count = coalesce(views_count, 0) + 1
   where id = p_article_id and status = 'published';
$$;

revoke execute on function public.increment_article_views(uuid) from public;
grant execute on function public.increment_article_views(uuid) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 8. Collections: only the owner may change a collection or its items,
--    and the item count is maintained by the database.
--    Implemented as triggers so it holds regardless of existing policies.
-- ---------------------------------------------------------------------
create or replace function public.guard_collection_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.collection_id, old.collection_id);
  owner  uuid;
begin
  if current_setting('request.jwt.claims', true) is not null
     and coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') in ('anon', 'authenticated') then
    select owner_id into owner from public.collections where id = target;
    if owner is distinct from auth.uid() then
      raise exception 'Only the collection owner can change its items' using errcode = '42501';
    end if;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists guard_collection_items on public.collection_items;
create trigger guard_collection_items
  before insert or update or delete on public.collection_items
  for each row execute function public.guard_collection_items();

create or replace function public.refresh_collection_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare target uuid := coalesce(new.collection_id, old.collection_id);
begin
  update public.collections
     set articles_count = (select count(*) from public.collection_items where collection_id = target),
         updated_at = now()
   where id = target;
  return null;
end $$;

drop trigger if exists refresh_collection_count on public.collection_items;
create trigger refresh_collection_count
  after insert or delete on public.collection_items
  for each row execute function public.refresh_collection_count();

create or replace function public.protect_collection_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.owner_id       := auth.uid();
      new.articles_count := 0;
      new.is_featured    := false;
    else
      new.owner_id       := old.owner_id;
      new.articles_count := old.articles_count;
      new.is_featured    := old.is_featured;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_collection_columns on public.collections;
create trigger protect_collection_columns
  before insert or update on public.collections
  for each row execute function public.protect_collection_columns();

create unique index if not exists collection_items_unique_idx on public.collection_items(collection_id, article_id);


-- ---------------------------------------------------------------------
-- 9. Helpful indexes for the queries the app actually runs.
-- ---------------------------------------------------------------------
create index if not exists articles_status_published_at_idx on public.articles(status, published_at desc);
create index if not exists articles_author_id_idx          on public.articles(author_id);
create index if not exists articles_category_id_idx        on public.articles(category_id);
create index if not exists collections_owner_id_idx        on public.collections(owner_id);
create index if not exists notifications_user_unread_idx   on public.notifications(user_id) where is_read = false;


-- ---------------------------------------------------------------------
-- Optional clean-up (review first, then uncomment):
-- the test article titled ".." with slug "-89o3e" is publicly visible.
-- update public.articles set status = 'draft' where slug = '-89o3e';
-- ---------------------------------------------------------------------
