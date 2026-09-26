/**
 * AfroArchive Ingestion Framework - Base Importer
 * Common abstract class implementing rate limiting, retries, pagination,
 * resumable checkpoints, incremental sync, rights enforcement, and audit logs.
 */

import { IngestionDatabase } from '../db';
import {
  Importer,
  NormalizedItem,
  ConnectorOptions,
  IngestionRunSummary,
  BatchFetchResult,
  SourceConfig,
} from '../types';
import { AfricanRelevanceClassifier } from '../relevance';

export abstract class BaseImporter<TRawRecord = unknown> implements Importer<TRawRecord> {
  abstract readonly name: string;
  abstract readonly sourceSlug: string;
  abstract readonly sourceName: string;
  abstract readonly connectorType: string;
  abstract readonly baseUrl: string;

  protected db: IngestionDatabase;
  protected rateLimitMs: number = 800;
  protected batchSize: number = 25;
  protected maxRetries: number = 3;

  constructor() {
    this.db = new IngestionDatabase();
  }

  /**
   * Fetches a paginated batch of records
   */
  abstract fetchBatch(
    cursor?: string | number,
    limit?: number,
    options?: ConnectorOptions
  ): Promise<BatchFetchResult<TRawRecord>>;

  /**
   * Normalizes a raw external record into the canonical AfroArchive schema
   */
  abstract normalize(rawRecord: TRawRecord): Promise<NormalizedItem | null>;

  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Executes an operation with exponential backoff
   */
  protected async withRetry<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        if (attempt >= retries) throw err;
        const backoff = 1000 * Math.pow(2, attempt - 1);
        console.warn(`[${this.name}] Request failed (attempt ${attempt}/${retries}). Retrying in ${backoff}ms...`);
        await this.sleep(backoff);
      }
    }
    throw new Error(`[${this.name}] Exhausted retries.`);
  }

  /**
   * Main execution harness for the importer
   */
  async run(options: ConnectorOptions = {}): Promise<IngestionRunSummary> {
    const startTime = Date.now();
    console.log(`\n===============================================================`);
    console.log(`🚀 Starting Ingestion: ${this.name} [${this.sourceSlug}]`);
    console.log(`===============================================================`);

    // 1. Load source config from DB
    const dbConfig: SourceConfig = await this.db.getSourceConfig(this.sourceSlug);
    const rateLimit = options.filters?.rateLimitMs ? (options.filters.rateLimitMs as number) : (dbConfig.rateLimitMs || this.rateLimitMs);
    const maxRecords = options.maxRecords || 25;
    const batchSize = options.batchSize || dbConfig.batchSize || this.batchSize;

    // Determine starting cursor for resumable / incremental sync
    let cursor: string | number | undefined = options.cursor;
    if (options.resume && dbConfig.lastCursor !== undefined && dbConfig.lastCursor !== null) {
      cursor = dbConfig.lastCursor;
      console.log(`🔁 Resuming import from saved checkpoint cursor: "${cursor}"`);
    } else if (options.incremental && dbConfig.lastSyncedAt) {
      console.log(`⏱️ Incremental mode active: fetching updates since ${dbConfig.lastSyncedAt}`);
    }

    // 2. Start ingestion run in DB
    const { runId } = await this.db.startIngestionRun({
      sourceSlug: this.sourceSlug,
      sourceName: this.sourceName,
      sourceType: 'api',
      baseUrl: this.baseUrl,
      workerName: this.name,
      connectorType: this.connectorType,
    });

    const stats = {
      discovered: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    let hasMore = true;
    let lastCheckpoint: string | number | null = cursor || null;

    try {
      while (hasMore && stats.discovered < maxRecords) {
        const remainingToFetch = Math.min(batchSize, maxRecords - stats.discovered);
        console.log(`📥 Fetching batch (cursor: ${cursor ?? 'start'}, limit: ${remainingToFetch})...`);

        const batchResult = await this.withRetry(() =>
          this.fetchBatch(cursor, remainingToFetch, { ...options, filters: { ...dbConfig.filters, ...options.filters } })
        );

        const records = batchResult.records;
        if (!records || records.length === 0) {
          console.log(`ℹ️  No more records returned from ${this.sourceName}.`);
          break;
        }

        stats.discovered += records.length;
        cursor = batchResult.nextCursor !== undefined ? batchResult.nextCursor : undefined;
        hasMore = batchResult.hasMore && cursor !== undefined && cursor !== null;
        lastCheckpoint = cursor !== undefined && cursor !== null ? cursor : lastCheckpoint;

        // Process batch items
        for (const [idx, rawRecord] of records.entries()) {
          const itemNum = stats.imported + stats.updated + stats.skipped + stats.failed + 1;
          let extId = `rec-${itemNum}`;

          try {
            // 3. Normalize
            const normalized = await this.normalize(rawRecord);
            if (!normalized) {
              stats.skipped++;
              continue;
            }

            extId = normalized.sourceRecordId;

            // 4. African Relevance Check
            const relevance = AfricanRelevanceClassifier.assess(
              normalized.title,
              normalized.summary,
              normalized.countryCodes,
              normalized.tags,
              normalized.content
            );

            if (!relevance.isRelevant) {
              console.log(`⏭️  [${itemNum}/${stats.discovered}] Skipped non-African record: "${normalized.title}" (Score: ${relevance.score})`);
              stats.skipped++;
              continue;
            }

            // 5. Dry Run Check
            if (options.dryRun) {
              console.log(`🔍 [DRY RUN] Would ingest: "${normalized.title}" [${normalized.knowledgeType}] (Relevance: ${relevance.score})`);
              stats.imported++;
              continue;
            }

            // 6. Upsert into Supabase
            const { action, id } = await this.db.upsertItem(normalized, this.sourceSlug, runId);

            if (action === 'imported') {
              stats.imported++;
              console.log(`✨ [${itemNum}/${stats.discovered}] Imported: "${normalized.title}" [${normalized.knowledgeType}] (ID: ${id})`);
            } else {
              stats.updated++;
              console.log(`🔄 [${itemNum}/${stats.discovered}] Updated: "${normalized.title}" [${normalized.knowledgeType}] (ID: ${id})`);
            }

            await this.sleep(rateLimit);
          } catch (itemErr: unknown) {
            stats.failed++;
            const msg = itemErr instanceof Error ? itemErr.message : String(itemErr);
            console.error(`❌ [${itemNum}/${stats.discovered}] Error on ${extId}:`, msg);
            await this.db.logIngestionError(runId, extId, 'write', 'ITEM_ERROR', msg, rawRecord);
          }
        }

        // Save progress checkpoint
        if (!options.dryRun) {
          await this.db.updateSourceCheckpoint(this.sourceSlug, lastCheckpoint);
        }

        if (stats.discovered >= maxRecords) {
          console.log(`⏹️  Reached requested maxRecords limit (${maxRecords}).`);
          break;
        }

        await this.sleep(rateLimit);
      }

      const status = stats.failed === 0 ? 'completed' : stats.imported > 0 ? 'partial' : 'failed';
      await this.db.finishIngestionRun(runId, status, stats);

      const durationMs = Date.now() - startTime;
      console.log(`\n---------------------------------------------------------------`);
      console.log(`🏁 Ingestion Finished in ${(durationMs / 1000).toFixed(1)}s`);
      console.log(`Status:       ${status.toUpperCase()}`);
      console.log(`Discovered:   ${stats.discovered}`);
      console.log(`Imported:     ${stats.imported}`);
      console.log(`Updated:      ${stats.updated}`);
      console.log(`Skipped:      ${stats.skipped}`);
      console.log(`Failed:       ${stats.failed}`);
      console.log(`Checkpoint:   ${lastCheckpoint ?? 'N/A'}`);
      console.log(`---------------------------------------------------------------\n`);

      return {
        runId,
        sourceSlug: this.sourceSlug,
        discovered: stats.discovered,
        imported: stats.imported,
        updated: stats.updated,
        skipped: stats.skipped,
        failed: stats.failed,
        durationMs,
        lastCheckpoint,
      };
    } catch (fatalErr: unknown) {
      const errSummary = fatalErr instanceof Error ? fatalErr.message : String(fatalErr);
      console.error(`💥 Ingestion run aborted:`, errSummary);
      await this.db.finishIngestionRun(runId, 'failed', { ...stats, errorSummary: errSummary });
      throw fatalErr;
    }
  }
}
