/**
 * AfroArchive Ingestion Framework - Bulk runner
 * Runs every bulk source sequentially with sensible limits and prints a summary.
 *
 * Usage:
 *   npx tsx scripts/ingestion/run-all.ts [--dry-run] [--rate=100] [--only=met,artic] [--scale=0.1] [--no-resume]
 *
 * Without --dry-run, each source resumes from its saved checkpoint (per Wikidata topic).
 * Re-running is safe: sourceRecordId is the stable institution id / QID, so the RPC upserts.
 */

import { importersMap, parseCommonOptions } from './cli';
import { IngestionRunSummary } from './types';

interface Job {
  key: string;
  source: string;
  topic?: string;
  limit: number;
}

const JOBS: Job[] = [
  { key: 'curated', source: 'curated', limit: 100 },
  { key: 'wikidata:states', source: 'wikidata', topic: 'states', limit: 400 },
  { key: 'wikidata:sites', source: 'wikidata', topic: 'sites', limit: 1500 },
  { key: 'wikidata:rulers', source: 'wikidata', topic: 'rulers', limit: 600 },
  { key: 'wikidata:people', source: 'wikidata', topic: 'people', limit: 600 },
  // Met "Arts of Africa" has ~420 open-access objects; Egyptian Art supplies the rest of the 3000.
  { key: 'met', source: 'met', topic: 'africa', limit: 500 },
  { key: 'met:egyptian', source: 'met', topic: 'egyptian', limit: 2500 },
  { key: 'artic', source: 'artic', limit: 1200 },
  { key: 'cleveland', source: 'cleveland', limit: 500 },
];

interface Row {
  job: string;
  status: 'ok' | 'error';
  summary?: IngestionRunSummary;
  error?: string;
}

function pad(s: string | number, n: number): string {
  return String(s).padEnd(n);
}

async function main() {
  const args = process.argv.slice(2);
  const common = parseCommonOptions(args);
  const dryRun = Boolean(common.dryRun);
  const resume = !dryRun && !args.includes('--no-resume');
  const rateLimitMs = common.rateLimitMs ?? 100;
  const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',').map((s) => s.trim());
  const scaleRaw = args.find((a) => a.startsWith('--scale='))?.slice(8);
  const scale = scaleRaw ? Math.max(0.001, Number(scaleRaw)) : 1;

  const jobs = JOBS.filter((j) => !only || only.includes(j.key) || only.includes(j.source));
  console.log(`AfroArchive bulk ingestion — ${jobs.length} job(s)${dryRun ? ' [DRY RUN]' : ''}${resume ? ' [resume]' : ''}, rate=${rateLimitMs}ms`);

  const rows: Row[] = [];
  const started = Date.now();
  for (const job of jobs) {
    const importer = importersMap[job.source]();
    try {
      const summary = await importer.run({
        ...common,
        resume,
        rateLimitMs,
        topic: job.topic,
        maxRecords: Math.max(1, Math.round(job.limit * scale)),
      });
      rows.push({ job: job.key, status: 'ok', summary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`💥 ${job.key} failed: ${msg}`);
      rows.push({ job: job.key, status: 'error', error: msg });
    }
  }

  const totals = { discovered: 0, imported: 0, updated: 0, skipped: 0, failed: 0 };
  console.log('\n═══════════════════════════════ SUMMARY ═══════════════════════════════');
  console.log(`${pad('Job', 18)}${pad('Status', 8)}${pad('Found', 8)}${pad(dryRun ? 'Would' : 'New', 8)}${pad('Updated', 9)}${pad('Skipped', 9)}${pad('Failed', 8)}Checkpoint`);
  for (const r of rows) {
    const s = r.summary;
    if (s) {
      totals.discovered += s.discovered;
      totals.imported += s.imported;
      totals.updated += s.updated;
      totals.skipped += s.skipped;
      totals.failed += s.failed;
    }
    console.log(
      `${pad(r.job, 18)}${pad(r.status, 8)}${pad(s?.discovered ?? '-', 8)}${pad(s?.imported ?? '-', 8)}${pad(s?.updated ?? '-', 9)}${pad(s?.skipped ?? '-', 9)}${pad(s?.failed ?? '-', 8)}${s?.lastCheckpoint ?? r.error ?? ''}`
    );
  }
  console.log(`${pad('TOTAL', 26)}${pad(totals.discovered, 8)}${pad(totals.imported, 8)}${pad(totals.updated, 9)}${pad(totals.skipped, 9)}${pad(totals.failed, 8)}`);
  console.log(`Elapsed: ${((Date.now() - started) / 60000).toFixed(1)} min`);

  if (rows.some((r) => r.status === 'error')) process.exitCode = 1;
}

main().catch((err) => {
  console.error('💥 Bulk ingestion failed:', err);
  process.exit(1);
});
