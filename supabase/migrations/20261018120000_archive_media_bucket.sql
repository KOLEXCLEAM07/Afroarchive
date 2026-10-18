-- ---------------------------------------------------------------------
-- Archive media bucket.
--
-- Imported museum images are normally hotlinked from the source museum.
-- The Art Institute of Chicago serves its IIIF images behind Cloudflare,
-- which returns 403 to any request whose referer is not artic.edu (our
-- localhost dev origin and our own deployed domain are both refused).
--
-- Rather than hotlink, AIC images are copied into this bucket and served
-- from our own origin. CC0 explicitly permits redistribution, and each
-- media row keeps its licence, attribution and original IIIF URL.
--
-- Public read (the `public` flag serves objects without auth); only the
-- service role writes, so no insert/update/delete policies are added here.
-- The writer is scripts/cleanup/rehost-artic-images.ts.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('archive-media', 'archive-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
