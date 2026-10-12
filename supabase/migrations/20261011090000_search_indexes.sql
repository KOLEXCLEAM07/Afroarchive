-- =====================================================================
-- AfroArchive: indexes so search and browsing stay fast with thousands
-- of records. Safe to run more than once.
-- =====================================================================

-- Fast "contains" search on titles and summaries (used by Discover and the museum).
create extension if not exists pg_trgm;

create index if not exists knowledge_items_title_trgm_idx
  on public.knowledge_items using gin (title gin_trgm_ops);

create index if not exists knowledge_items_summary_trgm_idx
  on public.knowledge_items using gin (summary gin_trgm_ops);

-- Browsing by type, newest first, and hiding flagged records.
create index if not exists knowledge_items_type_created_idx
  on public.knowledge_items (knowledge_type, created_at desc);

create index if not exists knowledge_items_status_idx
  on public.knowledge_items (verification_status);

-- Joins used on record pages and in the museum.
create index if not exists media_knowledge_item_idx
  on public.media (knowledge_item_id);

create index if not exists knowledge_item_tags_tag_idx
  on public.knowledge_item_tags (tag_id);

create index if not exists places_knowledge_item_idx
  on public.places (knowledge_item_id);

create index if not exists people_knowledge_item_idx
  on public.people (knowledge_item_id);

create index if not exists kingdoms_knowledge_item_idx
  on public.kingdoms_or_states (knowledge_item_id);

analyze public.knowledge_items;
