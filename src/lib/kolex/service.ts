/**
 * AfroArchive - Kolex AI Knowledge Layer Service
 * Orchestrates semantic retrieval, provenance verification, and citation construction.
 *
 * Pipeline:
 * User Question
 *  → Semantic vector search
 *  → Relevant AfroArchive chunks
 *  → Source verification & deduplication
 *  → Citation-ready synthesis context
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { KolexRetrievalResult, KolexSearchParams } from './types';
import { KolexSearchClient } from './search';
import { CitationBuilder } from './citations';

export class KolexKnowledgeService {
  private readonly searchClient: KolexSearchClient;

  constructor(client: SupabaseClient) {
    this.searchClient = new KolexSearchClient(client);
  }

  /**
   * Primary entrypoint: user question -> semantic retrieval -> verified sources
   */
  async retrieveKnowledge(params: KolexSearchParams): Promise<KolexRetrievalResult> {
    const startTime = Date.now();

    // 1. Semantic Vector Search
    const matches = await this.searchClient.search(params);

    // 2. Source Verification & Deduplication
    const sources = CitationBuilder.extractVerifiedSources(matches);

    // 3. Build Citation-ready Prompt Context
    const promptContext = CitationBuilder.buildPromptContext(matches, sources);

    const executionTimeMs = Date.now() - startTime;

    return {
      question: params.query,
      matches,
      sources,
      promptContext,
      executionTimeMs,
    };
  }
}
