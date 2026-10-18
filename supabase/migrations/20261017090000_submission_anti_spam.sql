-- AfroArchive: server-side anti-spam controls.
-- Apply after the existing moderation migration. Client-side honeypots are
-- convenience signals only; these database triggers are the enforcement layer.

create or replace function public.has_verified_email()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and email_confirmed_at is not null
  );
$$;

revoke all on function public.has_verified_email() from public;
grant execute on function public.has_verified_email() to authenticated;

-- A report needs a confirmed account, has a lower hourly ceiling, and cannot
-- be submitted repeatedly for the same item/reason within a day.
create or replace function public.limit_report_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_verified_email() then
    raise exception 'Verify your email address before submitting a report.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.reports
    where reporter_id = new.reporter_id
      and content_type = new.content_type
      and content_id = new.content_id
      and reason = new.reason
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'You already submitted that report recently.' using errcode = '23505';
  end if;

  if (select count(*) from public.reports
      where reporter_id = new.reporter_id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many reports. Please try again later.' using errcode = '54000';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_article_submission_safety()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.author_id <> auth.uid() and not public.is_moderator() then
    raise exception 'You can only submit your own articles.' using errcode = '42501';
  end if;

  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and not public.has_verified_email()
     and not public.is_moderator() then
    raise exception 'Verify your email address before publishing an article.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' and not public.is_moderator() then
    if (select count(*) from public.articles
        where author_id = new.author_id and created_at > now() - interval '24 hours') >= 3 then
      raise exception 'You have reached the daily article limit. Please try again tomorrow.' using errcode = '54000';
    end if;
    if exists (
      select 1 from public.articles
      where author_id = new.author_id
        and lower(title) = lower(new.title)
        and created_at > now() - interval '7 days'
    ) then
      raise exception 'An article with this title was submitted recently.' using errcode = '23505';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_article_submission_safety on public.articles;
create trigger enforce_article_submission_safety
  before insert or update on public.articles
  for each row execute function public.enforce_article_submission_safety();

create or replace function public.enforce_collection_submission_safety()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id <> auth.uid() and not public.is_moderator() then
    raise exception 'You can only create your own collections.' using errcode = '42501';
  end if;
  if not public.is_moderator() and (select count(*) from public.collections
      where owner_id = new.owner_id and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'You have reached the daily collection limit. Please try again tomorrow.' using errcode = '54000';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_collection_submission_safety on public.collections;
create trigger enforce_collection_submission_safety
  before insert on public.collections
  for each row execute function public.enforce_collection_submission_safety();

revoke all on function public.enforce_article_submission_safety() from public;
revoke all on function public.enforce_collection_submission_safety() from public;
revoke all on function public.limit_report_rate() from public;

-- These support the rate-limit and duplicate lookups above without scanning
-- whole content tables as the community grows.
create index if not exists articles_author_created_at_idx
  on public.articles(author_id, created_at desc);
create index if not exists collections_owner_created_at_idx
  on public.collections(owner_id, created_at desc);
create index if not exists reports_reporter_created_at_idx
  on public.reports(reporter_id, created_at desc);
