/**
 * AfroArchive Ingestion Framework - Base Importer
 * Common abstract class implementing rate limiting, retries, pagination,
 * resumable checkpoints, incremental sync, rights enforcement, and audit logs.
 *
 * In --dry-run mode no database connection is created at all, so dry runs work
 * without SUPABASE_SERVICE_ROLE_KEY.
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

  private _db: IngestionDatabase | null = null;
  protected rateLimitMs: number = 800;
  protected batchSize: number = 25;
  protected maxRetries: number = 3;

  /** Lazily created so that dry runs never need database credentials. */
  protected get db(): IngestionDatabase {
    if (!this._db) this._db = new IngestionDatabase();
    return this._db;
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

  /**
   * Whether a normalized record comes from a source already restricted to Africa
   * (e.g. a museum's African department). Such records are always relevant.
   */
  protected isTrustedAfricanSource(_item: NormalizedItem, _options: ConnectorOptions): boolean {
    return false;
  }

  /** Converts the checkpoint saved in the DB into the cursor for this run. */
  protected resolveResumeCursor(
    saved: string | number,
    _options: ConnectorOptions
  ): string | number | undefined {
    return saved;
  }

  /** Converts the current cursor into the value persisted as the checkpoint. */
  protected encodeCheckpoint(
    cursor: string | number | null,
    _saved: string | number | null | undefined,
    _options: ConnectorOptions
  ): string | number | null {
    return cursor;
  }

  protected async sleep(ms: number): Promise<void> {
    if (ms <= 0) return;
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
    const dryRun = Boolean(options.dryRun);
    console.log(`\n===============================================================`);
    console.log(`🚀 Starting Ingestion: ${this.name} [${this.sourceSlug}]${dryRun ? ' (DRY RUN — no database access)' : ''}`);
    if (options.topic) console.log(`   Topic: ${options.topic}`);
    console.log(`===============================================================`);

    // 1. Load source config from DB (skipped in dry run)
    const dbConfig: SourceConfig = dryRun ? {} : await this.db.getSourceConfig(this.sourceSlug);
    const filterRate = options.filters?.rateLimitMs as number | undefined;
    const rateLimit = options.rateLimitMs ?? filterRate ?? dbConfig.rateLimitMs ?? this.rateLimitMs;
    const maxRecords = options.maxRecords || 25;
    const batchSize = options.batchSize || dbConfig.batchSize || this.batchSize;

    // Determine starting cursor for resumable / incremental sync
    let cursor: string | number | undefined = options.cursor;
    if (options.resume && dryRun) {
      console.log('ℹ️  --resume ignored in dry run (checkpoints live in the database).');
    } else if (options.resume && dbConfig.lastCursor !== undefined && dbConfig.lastCursor !== null) {
      cursor = this.resolveResumeCursor(dbConfig.lastCursor, options);
      console.log(`🔁 Resuming import from saved checkpoint cursor: "${cursor ?? 'start'}"`);
    } else if (options.incremental && dbConfig.lastSyncedAt) {
      console.log(`⏱️ Incremental mode active: fetching updates since ${dbConfig.lastSyncedAt}`);
    }

    // 2. Start ingestion run in DB (skipped in dry run)
    const runId = dryRun
      ? 'dry-run'
      : (
          await this.db.startIngestionRun({
            sourceSlug: this.sourceSlug,
            sourceName: this.sourceName,
            sourceType: 'api',
            baseUrl: this.baseUrl,
            workerName: this.name,
            connectorType: this.connectorType,
          })
        ).runId;

    const stats = {
      discovered: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    let hasMore = true;
    let lastCheckpoint: string | number | null = cursor ?? null;
    let savedCheckpoint: string | number | null | undefined = dbConfig.lastCursor;

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
        cursor = batchResult.nextCursor !== undefined && batchResult.nextCursor !== null ? batchResult.nextCursor : undefined;
        hasMore = batchResult.hasMore && cursor !== undefined;
        lastCheckpoint = cursor !== undefined ? cursor : lastCheckpoint;

        // Process batch items
        for (const rawRecord of records) {
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
              normalized.content,
              {
                knowledgeType: normalized.knowledgeType,
                trustedAfricanSource: this.isTrustedAfricanSource(normalized, options),
              }
            );

            if (!relevance.isRelevant) {
              console.log(`⏭️  [${itemNum}/${stats.discovered}] Skipped non-African record: "${normalized.title}" (Score: ${relevance.score})`);
              stats.skipped++;
              continue;
            }

            // 5. Dry Run Check
            if (dryRun) {
              console.log(`🔍 [DRY RUN] Would ingest: "${normalized.title}" [${normalized.knowledgeType}] (${normalized.sourceRecordId}, ${normalized.rights.licenseType})`);
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
            if (!dryRun) {
              await this.db.logIngestionError(runId, extId, 'write', 'ITEM_ERROR', msg, rawRecord);
            }
          }
        }

        // Save progress checkpoint
        if (!dryRun) {
          const encoded = this.encodeCheckpoint(lastCheckpoint, savedCheckpoint, options);
          await this.db.updateSourceCheckpoint(this.sourceSlug, encoded);
          savedCheckpoint = encoded;
        }

        if (stats.discovered >= maxRecords) {
          console.log(`⏹️  Reached requested maxRecords limit (${maxRecords}).`);
          break;
        }

        if (!dryRun) await this.sleep(rateLimit);
      }

      const status = stats.failed === 0 ? 'completed' : stats.imported + stats.updated > 0 ? 'partial' : 'failed';
      if (!dryRun) await this.db.finishIngestionRun(runId, status, stats);

      const durationMs = Date.now() - startTime;
      console.log(`\n---------------------------------------------------------------`);
      console.log(`🏁 Ingestion Finished in ${(durationMs / 1000).toFixed(1)}s${dryRun ? ' (dry run)' : ''}`);
      console.log(`Status:       ${status.toUpperCase()}`);
      console.log(`Discovered:   ${stats.discovered}`);
      console.log(`${dryRun ? 'Would import:' : 'Imported:    '} ${stats.imported}`);
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
      if (!dryRun) {
        await this.db.finishIngestionRun(runId, 'failed', { ...stats, errorSummary: errSummary });
      }
      throw fatalErr;
    }
  }
}
