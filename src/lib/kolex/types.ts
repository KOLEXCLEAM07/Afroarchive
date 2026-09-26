/**
 * AfroArchive - Kolex AI Knowledge Layer Types
 * Definitions for document chunking, embeddings, vector similarity search,
 * metadata filtering, provenance verification, and citation-ready synthesis.
 */

import { KnowledgeType, LicenseType } from '../../types/database';

export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  startChar: number;
  endChar: number;
  tokenCount: number;
  sourceSlug?: string;
  sourceName?: string;
  title: string;
  knowledgeType: KnowledgeType;
  tags?: string[];
  publicationYear?: number;
  countryCodes?: string[];
  section?: string;
}

export interface GeneratedChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: ChunkMetadata;
}

export interface StoredChunk {
  id: string;
  knowledgeItemId: string;
  chunkIndex: number;
  chunkContent: string;
  tokenCount: number;
  metadata: ChunkMetadata;
  createdAt: string;
}

export interface StoredEmbedding {
  id: string;
  chunkId: string;
  modelName: string;
  embedding: number[];
  createdAt: string;
}

export type EmbeddingProviderType = 'gemini' | 'openai' | 'ollama' | 'local';

export interface EmbeddingProvider {
  readonly providerName: EmbeddingProviderType;
  readonly modelName: string;
  readonly dimension: number;
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface KolexSearchParams {
  query: string;
  matchThreshold?: number; // Minimum cosine similarity (0.0 to 1.0)
  matchCount?: number; // Number of chunks to retrieve (default: 5)
  knowledgeType?: KnowledgeType; // Filter by specific knowledge type
  sourceSlug?: string; // Filter by source (e.g. 'openalex', 'wikimedia-commons', 'wikidata')
  countryCode?: string; // Filter by African country code
}

export interface KolexMatch {
  chunkId: string;
  knowledgeItemId: string;
  title: string;
  slug: string;
  knowledgeType: KnowledgeType;
  chunkContent: string;
  chunkIndex: number;
  similarity: number; // 0.0 - 1.0
  attribution: string;
  licenseType: LicenseType;
  sourceUrl: string;
  originalUrl?: string;
  sourceSlug?: string;
  sourceName?: string;
  countryCodes: string[];
  doi?: string;
  metadata?: Record<string, unknown>;
}

export interface VerifiedSource {
  sourceIndex: number; // 1, 2, etc.
  badge: string; // "[1]", "[2]", etc.
  knowledgeItemId: string;
  title: string;
  slug: string;
  knowledgeType: KnowledgeType;
  sourceName: string;
  sourceUrl: string;
  url: string; // Alias for sourceUrl
  originalUrl?: string;
  doi?: string;
  attribution: string;
  licenseType: LicenseType;
  citationString: string;
  citation: string; // Alias for citationString
  relevanceScore: number;
}

export interface KolexRetrievalResult {
  question: string;
  matches: KolexMatch[];
  sources: VerifiedSource[];
  promptContext: string;
  executionTimeMs: number;
}
