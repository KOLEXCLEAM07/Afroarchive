/**
 * AfroArchive Ingestion Framework - Database Layer
 * Connects to Supabase, logs audit runs, prevents duplicate records, supports resumable checkpoints,
 * and upserts knowledge entities using secure RPC functions (SECURITY DEFINER).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { NormalizedItem, IngestionStatus, IngestionStage, SourceConfig } from './types';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gjtddtnonvyvvrwbscaq.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export class IngestionDatabase {
  public client: SupabaseClient;

  constructor() {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key missing in environment.');
    }
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  /**
   * Loads source configuration and last sync timestamps
   */
  async getSourceConfig(sourceSlug: string): Promise<SourceConfig> {
    const { data } = await this.client
      .from('sources')
      .select('id, metadata, ingestion_sources(id, config, last_synced_at)')
      .eq('slug', sourceSlug)
      .maybeSingle();

    if (!data || !data.ingestion_sources || data.ingestion_sources.length === 0) {
      return {};
    }

    const ins = data.ingestion_sources[0] as { config?: Record<string, unknown>; last_synced_at?: string };
    const conf = ins.config || {};

    return {
      endpoint: conf.endpoint as string | undefined,
      rateLimitMs: conf.rateLimitMs as number | undefined,
      batchSize: conf.batchSize as number | undefined,
      maxRetries: conf.maxRetries as number | undefined,
      lastCursor: conf.lastCursor as string | number | null | undefined,
      lastSyncedAt: ins.last_synced_at || null,
      filters: conf.filters as Record<string, unknown> | undefined,
      incremental: conf.incremental as boolean | undefined,
    };
  }

  /**
   * Updates source checkpoint for resumable & incremental synchronization
   */
  async updateSourceCheckpoint(
    sourceSlug: string,
    cursor: string | number | null,
    lastSyncedAt?: string
  ): Promise<void> {
    const { data: source } = await this.client
      .from('sources')
      .select('id')
      .eq('slug', sourceSlug)
      .maybeSingle();

    if (!source) return;

    const { data: ins } = await this.client
      .from('ingestion_sources')
      .select('id, config')
      .eq('source_id', source.id)
      .maybeSingle();

    if (!ins) return;

    const updatedConfig = {
      ...(ins.config || {}),
      lastCursor: cursor,
    };

    await this.client
      .from('ingestion_sources')
      .update({
        config: updatedConfig,
        last_synced_at: lastSyncedAt || new Date().toISOString(),
      })
      .eq('id', ins.id);
  }

  /**
   * Initializes or gets source and starts an ingestion run
   */
  async startIngestionRun(params: {
    sourceSlug: string;
    sourceName: string;
    sourceType: string;
    baseUrl?: string;
    workerName: string;
    connectorType: string;
  }): Promise<{ runId: string; sourceId: string }> {
    const { data, error } = await this.client.rpc('start_ingestion_run_rpc', {
      p_source_slug: params.sourceSlug,
      p_source_name: params.sourceName,
      p_source_type: params.sourceType,
      p_base_url: params.baseUrl || null,
      p_worker_name: params.workerName,
      p_connector_type: params.connectorType,
    });

    if (error) throw error;
    return {
      runId: data.run_id,
      sourceId: data.source_id,
    };
  }

  /**
   * Finalizes an ingestion run audit record with counts
   */
  async finishIngestionRun(
    runId: string,
    status: IngestionStatus,
    stats: {
      discovered: number;
      imported: number;
      updated: number;
      skipped: number;
      failed: number;
      errorSummary?: string;
    }
  ): Promise<void> {
    const { error } = await this.client.rpc('finish_ingestion_run_rpc', {
      p_run_id: runId,
      p_status: status,
      p_discovered: stats.discovered,
      p_imported: stats.imported,
      p_updated: stats.updated,
      p_skipped: stats.skipped,
      p_failed: stats.failed,
      p_error_summary: stats.errorSummary || null,
    });

    if (error) throw error;
  }

  /**
   * Upserts a normalized knowledge item and its entity relationships
   */
  async upsertItem(
    item: NormalizedItem,
    sourceSlug: string,
    runId: string
  ): Promise<{ action: 'imported' | 'updated'; id: string }> {
    const { data, error } = await this.client.rpc('upsert_knowledge_item_rpc', {
      p_run_id: runId,
      p_source_slug: sourceSlug,
      p_item: item,
    });

    if (error) throw error;
    return {
      action: data.action,
      id: data.id,
    };
  }

  /**
   * Logs an error in `ingestion_errors`
   */
  async logIngestionError(
    runId: string,
    externalId: string,
    stage: IngestionStage,
    errorCode: string,
    errorMessage: string,
    payloadSample?: unknown
  ): Promise<void> {
    const { error } = await this.client.rpc('log_ingestion_error_rpc', {
      p_run_id: runId,
      p_external_id: externalId,
      p_stage: stage,
      p_error_code: errorCode,
      p_error_message: errorMessage,
      p_payload_sample: payloadSample || null,
    });

    if (error) console.error('Failed to log error RPC:', error);
  }
}
