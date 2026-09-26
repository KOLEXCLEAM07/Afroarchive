/**
 * AfroArchive Ingestion Framework - Base Connector
 * Base class for all source connectors (Wikidata, OpenAlex, Wikimedia Commons, etc.)
 * Implements rate limiting, retries, relevance filtering, rights enforcement, and audit logs.
 */

import { IngestionDatabase } from './db';
import { NormalizedItem, ConnectorOptions, IngestionRunSummary } from './types';
import { AfricanRelevanceClassifier } from './relevance';

export abstract class BaseConnector {
  abstract readonly name: string;
  abstract readonly sourceSlug: string;
  abstract readonly sourceName: string;
  abstract readonly connectorType: string;
  abstract readonly baseUrl: string;

  protected db: IngestionDatabase;
  protected rateLimitMs: number = 800; // respectful rate limit

  constructor() {
    this.db = new IngestionDatabase();
  }

  /**
   * Fetches raw records from the external source
   */
  abstract fetchRecords(options: ConnectorOptions): Promise<unknown[]>;

  /**
   * Transforms an external raw record into a standardized NormalizedItem
   */
  abstract normalize(rawRecord: unknown): Promise<NormalizedItem | null>;

  /**
   * Helper for delay / rate limiting
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Executes fetch with exponential backoff retry logic
   */
  protected async fetchWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        console.warn(`[${this.name}] Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs * attempt}ms...`);
        await this.sleep(delayMs * attempt);
      }
    }
    throw new Error(`[${this.name}] Exhausted all ${maxRetries} retries.`);
  }

  /**
   * Main execution cycle for this connector
   */
  async run(options: ConnectorOptions = {}): Promise<IngestionRunSummary> {
    const startTime = Date.now();
    console.log(`\n==================================================`);
    console.log(`🚀 Starting Ingestion Run: ${this.name} (${this.sourceSlug})`);
    console.log(`==================================================`);

    // 1. Ensure source and ingestion run are registered
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

    try {
      // 3. Fetch records
      console.log(`📥 Fetching records from ${this.sourceName}...`);
      const rawRecords = await this.fetchRecords(options);
      stats.discovered = rawRecords.length;
      console.log(`✓ Discovered ${stats.discovered} candidate records.`);

      // 4. Process each record through the pipeline
      for (const [index, rawRecord] of rawRecords.entries()) {
        const itemNumber = index + 1;
        let externalId = `item-${itemNumber}`;

        try {
          // Normalize
          const normalized = await this.normalize(rawRecord);
          if (!normalized) {
            stats.skipped++;
            continue;
          }

          externalId = normalized.sourceRecordId;

          // African Relevance Classification
          const relevance = AfricanRelevanceClassifier.assess(
            normalized.title,
            normalized.summary,
            normalized.countryCodes,
            normalized.tags,
            normalized.content
          );

          if (!relevance.isRelevant) {
            console.log(`⏭️  [${itemNumber}/${stats.discovered}] Skipped non-African record: "${normalized.title}" (Score: ${relevance.score})`);
            await this.db.logIngestionItem(runId, externalId, rawRecord, 'skipped', undefined, `Low African relevance score (${relevance.score})`);
            stats.skipped++;
            continue;
          }

          // Dry-run mode check
          if (options.dryRun) {
            console.log(`🔍 [DRY RUN] Would ingest: "${normalized.title}" [${normalized.knowledgeType}] (Relevance: ${relevance.score})`);
            stats.imported++;
            continue;
          }

          // Upsert into Supabase
          const { action, id } = await this.db.upsertItem(normalized, this.sourceSlug, runId);

          if (action === 'imported') {
            stats.imported++;
            console.log(`✨ [${itemNumber}/${stats.discovered}] Imported: "${normalized.title}" [${normalized.knowledgeType}]`);
          } else {
            stats.updated++;
            console.log(`🔄 [${itemNumber}/${stats.discovered}] Updated: "${normalized.title}" [${normalized.knowledgeType}]`);
          }

          await this.db.logIngestionItem(runId, externalId, rawRecord, action, id);

          // Respect API rate limits
          await this.sleep(this.rateLimitMs);
        } catch (err: unknown) {
          stats.failed++;
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`❌ [${itemNumber}/${stats.discovered}] Failed to process ${externalId}:`, errorMessage);
          await this.db.logIngestionError(runId, externalId, 'write', 'PROCESS_ERROR', errorMessage, rawRecord);
        }
      }

      // 5. Finalize run
      const status = stats.failed === 0 ? 'completed' : stats.imported > 0 ? 'partial' : 'failed';
      await this.db.finishIngestionRun(runId, status, stats);

      const durationMs = Date.now() - startTime;
      console.log(`\n--------------------------------------------------`);
      console.log(`🏁 Ingestion Run Finished in ${(durationMs / 1000).toFixed(1)}s`);
      console.log(`Status:     ${status.toUpperCase()}`);
      console.log(`Discovered: ${stats.discovered}`);
      console.log(`Imported:   ${stats.imported}`);
      console.log(`Updated:    ${stats.updated}`);
      console.log(`Skipped:    ${stats.skipped}`);
      console.log(`Failed:     ${stats.failed}`);
      console.log(`--------------------------------------------------\n`);

      return {
        runId,
        sourceSlug: this.sourceSlug,
        discovered: stats.discovered,
        imported: stats.imported,
        updated: stats.updated,
        skipped: stats.skipped,
        failed: stats.failed,
        durationMs,
      };
    } catch (fatalError: unknown) {
      const errorSummary = fatalError instanceof Error ? fatalError.message : String(fatalError);
      console.error(`💥 Fatal error in ingestion run:`, errorSummary);
      await this.db.finishIngestionRun(runId, 'failed', {
        ...stats,
        errorSummary,
      });
      throw fatalError;
    }
  }
}
