/**
 * AfroArchive Ingestion Framework - CLI Runner
 * Usage:
 *   npx tsx scripts/ingestion/cli.ts --source=<source_name> [--limit=N] [--dry-run] [--resume] [--incremental]
 */

import {
  BaseImporter,
  WikidataImporter,
  OpenAlexImporter,
  WikimediaImporter,
  ZenodoImporter,
  OpenAfricaImporter,
  MasakhaneImporter,
} from './importers';

const importersMap: Record<string, () => BaseImporter> = {
  wikidata: () => new WikidataImporter(),
  openalex: () => new OpenAlexImporter(),
  wikimedia: () => new WikimediaImporter(),
  'wikimedia-commons': () => new WikimediaImporter(),
  zenodo: () => new ZenodoImporter(),
  openafrica: () => new OpenAfricaImporter(),
  masakhane: () => new MasakhaneImporter(),
};

async function main() {
  const args = process.argv.slice(2);
  const sourceArg = args.find((a) => a.startsWith('--source='))?.split('=')[1];
  const limitArg = args.find((a) => a.startsWith('--limit='))?.split('=')[1];
  const topicArg = args.find((a) => a.startsWith('--topic='))?.split('=')[1];
  const queryArg = args.find((a) => a.startsWith('--query='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  const resume = args.includes('--resume');
  const incremental = args.includes('--incremental');

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
    console.log('  --topic=NAME     Filter by specific African scholarly topic');
    console.log('  --query=TEXT     Custom search query string');
    console.log('  --dry-run        Simulate ingestion without writing to DB');
    console.log('  --resume         Resume from saved checkpoint cursor in database');
    console.log('  --incremental    Only ingest records updated since last sync');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/ingestion/cli.ts --source=openalex --limit=5');
    console.log('  npx tsx scripts/ingestion/cli.ts --source=openalex --topic="philosophy" --limit=3');
    console.log('  npx tsx scripts/ingestion/cli.ts --source=openalex --topic="archaeology" --limit=3');
    console.log('  npx tsx scripts/ingestion/cli.ts --source=wikidata --limit=5 --resume');
    return;
  }

  const factory = importersMap[sourceArg.toLowerCase()];
  if (!factory) {
    console.error(`❌ Unknown source: "${sourceArg}".`);
    console.error(`Available sources: ${Object.keys(importersMap).join(', ')}`);
    process.exit(1);
  }

  const importer = factory();
  const maxRecords = limitArg ? parseInt(limitArg, 10) : 5;

  await importer.run({
    maxRecords,
    dryRun,
    resume,
    incremental,
    topic: topicArg,
    query: queryArg,
  });
}

main().catch((err) => {
  console.error('\n💥 Ingestion Failed:', err);
  process.exit(1);
});
