/**
 * One-off maintenance script: copies Art Institute of Chicago images into the
 * `archive-media` Supabase Storage bucket.
 *
 * Why: artic.edu serves its IIIF images behind Cloudflare, which returns 403 to
 * any request whose referer is not artic.edu. Hotlinked <img> tags from our app
 * (localhost or our own domain) are therefore refused, leaving the 1,100 Chicago
 * records with no visible picture even though the image data imported correctly.
 * The artwork is public domain and AIC releases the images under CC0, so we copy
 * them to our own origin instead of hotlinking. The original IIIF URL is kept in
 * `metadata` for provenance.
 *
 * Idempotent: a row is skipped once its URLs point at our bucket, so re-running
 * after a fresh AIC import only processes the new records.
 *
 *   npx tsx scripts/cleanup/rehost-artic-images.ts                 # dry run (all)
 *   npx tsx scripts/cleanup/rehost-artic-images.ts --apply         # perform copy
 *   npx tsx scripts/cleanup/rehost-artic-images.ts --apply --limit=25
 *   npx tsx scripts/cleanup/rehost-artic-images.ts --apply --force  # re-copy hosted rows
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  }
}

loadEnv();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!url || !key) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.');
  process.exit(1);
}

const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');
let limit = 0; // 0 = no limit
for (const arg of process.argv) {
  if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1], 10) || 0;
}

const BUCKET = 'archive-media';
const AIC_SOURCE_SLUG = 'art-institute-chicago';
const CONCURRENCY = 4;
const PUBLIC_PREFIX = `${url.replace(/\/+$/, '')}/storage/v1/object/public/${BUCKET}/`;

const supabase = createClient(url, key, { auth: { persistSession: false } });

// AIC serves the image to requests carrying an artic.edu referer. Sending the
// same headers our downloader uses keeps us within their bot-protection rules.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const AIC_HEADERS: Record<string, string> = {
  'User-Agent': UA,
  'AIC-User-Agent': 'AfroArchive/1.0 (+https://afroarchive.org; open heritage archive)',
  Referer: 'https://www.artic.edu/',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

interface MediaRow {
  id: string;
  knowledge_item_id: string;
  title: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  source_media_id: string | null;
  is_hosted_internally: boolean | null;
  storage_path: string | null;
  metadata: Record<string, unknown> | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isArticUrl = (u: string | null | undefined): u is string => !!u && u.includes('artic.edu');

/** The IIIF image base (…/iiif/2/<image_id>) for a media row, or null. */
function iiifBase(row: MediaRow): string | null {
  const stored = row.metadata?.iiif_base;
  if (typeof stored === 'string' && stored.includes('/iiif/2/')) return stored.replace(/\/+$/, '');
  const match = (row.file_url ?? row.thumbnail_url)?.match(/^https?:\/\/[^/]+\/iiif\/2\/[^/]+/);
  return match ? match[0] : null;
}

/**
 * IIIF request for a maximum width. The `!w,h` (confined) form never upscales:
 * a plain `843,` is rejected with "scales in excess of 100%" for any image
 * narrower than 843px, which is what quietly broke 27 of the Chicago records.
 */
const confined = (base: string, width: number) => `${base}/full/!${width},${width}/0/default.jpg`;

async function download(imageUrl: string, attempts = 3): Promise<Buffer> {
  let lastError = '';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await fetch(imageUrl, { headers: AIC_HEADERS });
    if (res.ok) {
      const type = res.headers.get('content-type') || '';
      if (!type.startsWith('image/')) throw new Error(`not an image (${res.status} ${type})`);
      return Buffer.from(await res.arrayBuffer());
    }
    lastError = `HTTP ${res.status}`;
    if (attempt < attempts) await sleep(500 * attempt);
  }
  throw new Error(lastError);
}

async function upload(objectPath: string, body: Buffer): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, body, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' });
  if (error) throw error;
  return `${PUBLIC_PREFIX}${objectPath}`;
}

/** Runs `fn` over `items` with a fixed number of workers. */
async function mapPool<T>(items: T[], size: number, fn: (item: T, index: number) => Promise<void>): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    for (;;) {
      const index = next++;
      if (index >= items.length) return;
      await fn(items[index], index);
    }
  });
  await Promise.all(workers);
}

async function rehostOne(row: MediaRow, index: number, total: number): Promise<'hosted' | 'failed'> {
  const label = `[${index + 1}/${total}] ${row.title ?? row.id}`;
  try {
    const base = iiifBase(row);
    const mainSource = base
      ? confined(base, 843)
      : isArticUrl(row.file_url) ? row.file_url : row.thumbnail_url;
    const thumbSource = base
      ? confined(base, 400)
      : isArticUrl(row.thumbnail_url) ? row.thumbnail_url : mainSource;
    if (!mainSource) throw new Error('no source URL to copy');

    const mainPath = `artic/${row.id}.jpg`;
    const thumbPath = `artic/${row.id}-thumb.jpg`;

    const [mainBody, thumbBody] = await Promise.all([download(mainSource), download(thumbSource!)]);
    const [mainUrl, thumbUrl] = await Promise.all([
      upload(mainPath, mainBody),
      upload(thumbPath, thumbBody),
    ]);

    const { error } = await supabase
      .from('media')
      .update({
        file_url: mainUrl,
        thumbnail_url: thumbUrl,
        storage_path: mainPath,
        is_hosted_internally: true,
        metadata: {
          ...(row.metadata ?? {}),
          original_file_url: row.file_url,
          original_thumbnail_url: row.thumbnail_url,
          rehosted_at: new Date().toISOString(),
          rehost_reason: 'artic.edu blocked hotlinked requests (Cloudflare)',
        },
      })
      .eq('id', row.id);
    if (error) throw error;

    console.log(`  ✓ ${label}  ${(mainBody.length / 1024).toFixed(0)} KB`);
    return 'hosted';
  } catch (error) {
    console.error(`  ✗ ${label}: ${error instanceof Error ? error.message : String(error)}`);
    return 'failed';
  }
}

async function main() {
  console.log('='.repeat(64));
  console.log('  Re-host Art Institute of Chicago images → Supabase Storage');
  console.log('='.repeat(64));
  console.log(`  Bucket: ${BUCKET}`);
  console.log(`  Mode:   ${apply ? (force ? 'APPLY (force)' : 'APPLY') : 'DRY RUN'}`);
  if (limit) console.log(`  Limit:  ${limit}`);
  console.log();

  // Resolve the AIC source id (precise) and fall back to the media-id prefix.
  const { data: source } = await supabase
    .from('sources')
    .select('id')
    .eq('slug', AIC_SOURCE_SLUG)
    .maybeSingle();
  const aicSourceId = source?.id ?? null;

  const candidates: MediaRow[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from('media')
      .select('id, knowledge_item_id, title, file_url, thumbnail_url, source_media_id, is_hosted_internally, storage_path, metadata')
      .eq('media_type', 'image')
      .order('id')
      .range(from, from + 999);
    query = aicSourceId
      ? query.eq('source_id', aicSourceId)
      : query.like('source_media_id', 'artic-%');

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as MediaRow[];
    if (!rows.length) break;

    for (const row of rows) {
      const hosted = row.is_hosted_internally === true && !!row.storage_path;
      if (hosted && !force) continue;
      if (!isArticUrl(row.file_url) && !isArticUrl(row.thumbnail_url)) continue; // already ours
      candidates.push(row);
    }
    if (rows.length < 1000) break;
  }

  const todo = limit > 0 ? candidates.slice(0, limit) : candidates;
  console.log(`${candidates.length} AIC image(s) need re-hosting.`);
  if (candidates.length) {
    for (const row of todo.slice(0, 10)) {
      console.log(`  • ${row.title ?? row.id}  →  ${row.file_url}`);
    }
    if (candidates.length > 10) console.log(`  …and ${candidates.length - 10} more.`);
  }

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to copy these images.');
    return;
  }
  if (!todo.length) {
    console.log('\nNothing to do.');
    return;
  }

  console.log();
  let hosted = 0;
  let failed = 0;
  let done = 0;
  await mapPool(todo, CONCURRENCY, async (row, index) => {
    const result = await rehostOne(row, index, todo.length);
    if (result === 'hosted') hosted++;
    else failed++;
    if (++done % 25 === 0) console.log(`  …${done}/${todo.length}`);
  });

  console.log('\n' + '='.repeat(64));
  console.log(`  Re-hosted: ${hosted}`);
  console.log(`  Failed:    ${failed}`);
  console.log('='.repeat(64));
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
