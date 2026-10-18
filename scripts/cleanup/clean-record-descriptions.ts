/**
 * One-off maintenance script: rewrites imported record descriptions that were
 * stored as raw provider catalogue pages (Internet Archive book metadata, OCR of
 * scanned pages, David Rumsey map notes, Flickr reuse instructions, promotion).
 *
 * Uses the same `cleanRecordDescription` helper as the UI and the Wikimedia
 * importer, so stored text and rendered text stay in step.
 *
 *   npx tsx scripts/cleanup/clean-record-descriptions.ts            # dry run
 *   npx tsx scripts/cleanup/clean-record-descriptions.ts --apply    # write changes
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { cleanRecordDescription, hasImportedNoise } from '../../src/lib/recordText';

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
const supabase = createClient(url, key, { auth: { persistSession: false } });

interface Row {
  id: string;
  slug: string | null;
  title: string | null;
  summary: string | null;
  content: string | null;
}

function preview(value: string | null): string {
  return value === null ? '(null)' : value.replace(/\s+/g, ' ').slice(0, 90);
}

async function main() {
  const changed: Array<{ row: Row; content: string | null; summary: string | null }> = [];
  let scanned = 0;

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('id, slug, title, summary, content')
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    if (!rows.length) break;
    scanned += rows.length;

    for (const row of rows) {
      if (!hasImportedNoise(row.content) && !hasImportedNoise(row.summary)) continue
      const content = cleanRecordDescription(row.content);
      // `summary` is NOT NULL in the schema; an empty string reads as "no summary".
      const summary = cleanRecordDescription(row.summary) ?? '';
      if (content !== row.content || summary !== row.summary) {
        changed.push({ row, content, summary });
      }
    }
    if (rows.length < 1000) break;
  }

  console.log(`Scanned ${scanned} records; ${changed.length} need cleaning.`);
  for (const { row, content, summary } of changed.slice(0, 60)) {
    console.log(`\n• ${row.slug ?? row.id}`);
    if (content !== row.content) console.log(`  content: ${preview(row.content)}  →  ${preview(content)}`);
    if (summary !== row.summary) console.log(`  summary: ${preview(row.summary)}  →  ${preview(summary)}`);
  }
  if (changed.length > 60) console.log(`\n…and ${changed.length - 60} more.`);

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to write these changes.');
    return;
  }

  let done = 0;
  for (const { row, content, summary } of changed) {
    const { error } = await supabase
      .from('knowledge_items')
      .update({ content, summary })
      .eq('id', row.id);
    if (error) throw error;
    done += 1;
  }
  console.log(`\nUpdated ${done} records.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
