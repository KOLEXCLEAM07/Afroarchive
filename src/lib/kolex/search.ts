/**
 * AfroArchive - Kolex AI Semantic Search Client
 * Executes cosine similarity search over pgvector embeddings with metadata filters.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { KolexMatch, KolexSearchParams } from './types';
import { getEmbeddingProvider } from './embeddings';

export class KolexSearchClient {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /**
   * Performs semantic vector search with optional metadata filters
   */
  async search(params: KolexSearchParams): Promise<KolexMatch[]> {
    const provider = getEmbeddingProvider();
    const queryVector = await provider.generateEmbedding(params.query);

    const threshold = params.matchThreshold ?? 0.2;
    const limit = params.matchCount ?? 5;

    // Call match_knowledge_chunks_v2 RPC in Supabase
    const { data, error } = await this.client.rpc('match_knowledge_chunks_v2', {
      query_embedding: queryVector,
      match_threshold: threshold,
      match_count: limit,
      filter_knowledge_type: params.knowledgeType || null,
      filter_source_slug: params.sourceSlug || null,
      filter_country_code: params.countryCode || null,
    });

    if (error) {
      // Fallback to v1 if v2 has signature mismatch
      const { data: v1Data, error: v1Error } = await this.client.rpc('match_knowledge_chunks', {
        query_embedding: queryVector,
        match_threshold: threshold,
        match_count: limit,
        filter_knowledge_type: params.knowledgeType || null,
      });

      if (v1Error) {
        throw new Error(`Kolex vector search failed: ${v1Error.message}`);
      }

      return (v1Data || []).map((row: any) => ({
        chunkId: row.chunk_id,
        knowledgeItemId: row.knowledge_item_id,
        title: row.title,
        slug: '',
        knowledgeType: row.knowledge_type,
        chunkContent: row.chunk_content,
        chunkIndex: 0,
        similarity: parseFloat(row.similarity.toFixed(4)),
        attribution: row.attribution,
        licenseType: 'unknown',
        sourceUrl: row.source_url,
        countryCodes: [],
      }));
    }

    return (data || []).map((row: any) => ({
      chunkId: row.chunk_id,
      knowledgeItemId: row.knowledge_item_id,
      title: row.title,
      slug: row.slug || '',
      knowledgeType: row.knowledge_type,
      chunkContent: row.chunk_content,
      chunkIndex: row.chunk_index || 0,
      similarity: parseFloat(row.similarity.toFixed(4)),
      attribution: row.attribution || 'AfroArchive Repository',
      licenseType: row.license_type || 'unknown',
      sourceUrl: row.source_url,
      originalUrl: row.original_url || row.source_url,
      sourceSlug: row.source_slug,
      sourceName: row.source_name,
      countryCodes: row.country_codes || [],
      doi: row.doi,
      metadata: row.metadata || {},
    }));
  }
}
