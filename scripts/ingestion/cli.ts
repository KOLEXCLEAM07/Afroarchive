/**
 * AfroArchive Ingestion Framework - CLI Runner
 * Usage:
 *   npx tsx scripts/ingestion/cli.ts --source=<source_name> [--limit=N] [--topic=NAME] [--dry-run] [--resume]
 *                                    [--rate=MS] [--batch=N] [--incremental] [--no-wikipedia]
 */

import {
  BaseImporter,
  WikidataImporter,
  OpenAlexImporter,
  WikimediaImporter,
  ZenodoImporter,
  OpenAfricaImporter,
  MasakhaneImporter,
  CuratedImporter,
  MetMuseumImporter,
  ArticImporter,
  ClevelandImporter,
  SketchfabImporter,
} from './importers';
import { ConnectorOptions } from './types';

export const importersMap: Record<string, () => BaseImporter> = {
  wikidata: () => new WikidataImporter(),
  openalex: () => new OpenAlexImporter(),
  wikimedia: () => new WikimediaImporter(),
  'wikimedia-commons': () => new WikimediaImporter(),
  zenodo: () => new ZenodoImporter(),
  openafrica: () => new OpenAfricaImporter(),
  masakhane: () => new MasakhaneImporter(),
  curated: () => new CuratedImporter(),
  met: () => new MetMuseumImporter(),
  artic: () => new ArticImporter(),
  cleveland: () => new ClevelandImporter(),
  sketchfab: () => new SketchfabImporter(),
};

function argValue(args: string[], name: string): string | undefined {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function intArg(args: string[], name: string): number | undefined {
  const raw = argValue(args, name);
  if (raw === undefined) return undefined;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    console.error(`❌ --${name} must be a non-negative integer (got "${raw}")`);
    process.exit(1);
  }
  return n;
}

/** Parses shared CLI flags into ConnectorOptions (used by cli.ts and run-all.ts). */
export function parseCommonOptions(args: string[]): ConnectorOptions {
  const filters: Record<string, unknown> = {};
  if (args.includes('--no-wikipedia')) filters.wikipediaSummaries = false;
  return {
    dryRun: args.includes('--dry-run'),
    resume: args.includes('--resume'),
    incremental: args.includes('--incremental'),
    rateLimitMs: intArg(args, 'rate'),
    batchSize: intArg(args, 'batch') || undefined,
    filters,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const sourceArg = argValue(args, 'source');
  const limit = intArg(args, 'limit');
  const topicArg = argValue(args, 'topic');
  const queryArg = argValue(args, 'query');

  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║       AfroArchive Knowledge Ingestion Engine v1.0           ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');

  if (!sourceArg) {
    console.log('Available Importer Sources:');
    for (const key of Object.keys(importersMap)) {
      console.log(`  • ${key}`);
    }
    console.log('\nOptions:');
    console.log('  --limit=N        Maximum records to process (default: 5)');
    console.log('  --topic=NAME     Topic / mode (wikidata: states|sites|rulers|people; met: africa|egyptian)');
    console.log('  --query=TEXT     Custom search query string');
    console.log('  --dry-run        Fetch + normalize without touching the DB (no credentials needed)');
    console.log('  --resume         Resume from saved checkpoint cursor in database');
    console.log('  --rate=MS        Pause after each DB upsert (default 800; 100 recommended for bulk)');
    console.log('  --batch=N        Records requested per API page');
    console.log('  --no-wikipedia   Wikidata: do not fetch Wikipedia lead text (keeps records CC0)');
    console.log('  --incremental    Only ingest records updated since last sync');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/ingestion/cli.ts --source=met --limit=40 --dry-run');
    console.log('  npx tsx scripts/ingestion/cli.ts --source=wikidata --topic=sites --limit=1500 --rate=100 --resume');
    console.log('  npx tsx scripts/ingestion/run-all.ts --dry-run');
    return;
  }

  const factory = importersMap[sourceArg.toLowerCase()];
  if (!factory) {
    console.error(`❌ Unknown source: "${sourceArg}".`);
    console.error(`Available sources: ${Object.keys(importersMap).join(', ')}`);
    process.exit(1);
  }

  const importer = factory();
  await importer.run({
    ...parseCommonOptions(args),
    maxRecords: limit || 5,
    topic: topicArg,
    query: queryArg,
  });
}

// Only run when executed directly (run-all.ts imports helpers from this module).
const invokedDirectly = /cli\.ts$/.test(process.argv[1] || '');
if (invokedDirectly) {
  main().catch((err) => {
    console.error('\n💥 Ingestion Failed:', err);
    process.exit(1);
  });
}
