-- =====================================================================
-- Moderation actions and audit trail.
-- Run after 20261017090000_submission_anti_spam.sql.
-- =====================================================================

create table if not exists public.moderation_actions (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  report_id   uuid references public.reports(id) on delete set null,
  target_type text not null check (target_type in ('article', 'record', 'report')),
  target_id   text not null check (char_length(target_id) between 1 and 200),
  action      text not null check (action in (
    'report_resolved', 'report_dismissed', 'article_under_review',
    'article_published', 'record_hidden', 'record_restored'
  )),
  note        text check (note is null or char_length(note) <= 1000),
  created_at  timestamptz not null default now()
);

create index if not exists moderation_actions_created_at_idx
  on public.moderation_actions(created_at desc);
create index if not exists moderation_actions_target_idx
  on public.moderation_actions(target_type, target_id, created_at desc);

alter table public.moderation_actions enable row level security;

drop policy if exists "Moderators read moderation audit" on public.moderation_actions;
create policy "Moderators read moderation audit" on public.moderation_actions
  for select to authenticated
  using ((select public.is_moderator()));

-- Keep writes out of the browser. Each function below validates the role,
-- performs one narrowly scoped action, then records the decision.
drop policy if exists "Moderators update reports" on public.reports;
drop policy if exists "Moderators can update articles" on public.articles;

drop function if exists public.moderate_report(uuid, text, text);
create function public.moderate_report(
  p_report_id uuid,
  p_outcome text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can resolve reports' using errcode = '42501';
  end if;
  if p_outcome not in ('resolved', 'dismissed') then
    raise exception 'Invalid report outcome' using errcode = '22023';
  end if;
  if char_length(coalesce(p_note, '')) > 1000 then
    raise exception 'Moderator note is too long' using errcode = '22001';
  end if;

  update public.reports
     set status = p_outcome,
         moderator_note = nullif(btrim(p_note), ''),
         resolved_by = auth.uid(),
         resolved_at = now()
   where id = p_report_id and status = 'pending';

  if not found then
    raise exception 'This report is no longer open' using errcode = 'P0002';
  end if;

  insert into public.moderation_actions (actor_id, report_id, target_type, target_id, action, note)
  values (
    auth.uid(), p_report_id, 'report', p_report_id::text,
    case when p_outcome = 'resolved' then 'report_resolved' else 'report_dismissed' end,
    nullif(btrim(p_note), '')
  );
end;
$$;

drop function if exists public.moderate_article(uuid, text, text);
create function public.moderate_article(
  p_article_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can review articles' using errcode = '42501';
  end if;
  if p_status not in ('published', 'under_review') then
    raise exception 'Invalid article status' using errcode = '22023';
  end if;
  if char_length(coalesce(p_note, '')) > 1000 then
    raise exception 'Moderator note is too long' using errcode = '22001';
  end if;

  update public.articles set status = p_status where id = p_article_id;
  if not found then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;

  insert into public.moderation_actions (actor_id, target_type, target_id, action, note)
  values (
    auth.uid(), 'article', p_article_id::text,
    case when p_status = 'published' then 'article_published' else 'article_under_review' end,
    nullif(btrim(p_note), '')
  );
end;
$$;

drop function if exists public.set_record_status(uuid, text);
drop function if exists public.set_record_status(uuid, text, text);
create function public.set_record_status(
  p_record_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can change record status' using errcode = '42501';
  end if;
  if p_status not in ('flagged', 'normalized', 'verified') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  if char_length(coalesce(p_note, '')) > 1000 then
    raise exception 'Moderator note is too long' using errcode = '22001';
  end if;

  update public.knowledge_items
     set verification_status = p_status, updated_at = now()
   where id = p_record_id;
  if not found then
    raise exception 'Record not found' using errcode = 'P0002';
  end if;

  insert into public.moderation_actions (actor_id, target_type, target_id, action, note)
  values (
    auth.uid(), 'record', p_record_id::text,
    case when p_status = 'flagged' then 'record_hidden' else 'record_restored' end,
    nullif(btrim(p_note), '')
  );
end;
$$;

revoke all on function public.moderate_report(uuid, text, text) from public, anon;
revoke all on function public.moderate_article(uuid, text, text) from public, anon;
revoke all on function public.set_record_status(uuid, text, text) from public, anon;
grant execute on function public.moderate_report(uuid, text, text) to authenticated;
grant execute on function public.moderate_article(uuid, text, text) to authenticated;
grant execute on function public.set_record_status(uuid, text, text) to authenticated;
