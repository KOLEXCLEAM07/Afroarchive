/**
 * AfroArchive - Kolex AI Document Chunker
 * Deconstructs knowledge items into semantically coherent, contextualized text chunks
 * with configurable token overlap and entity-level metadata prefixes.
 */

import { GeneratedChunk, ChunkMetadata } from './types';
import { KnowledgeType } from '../../types/database';

export interface ChunkingOptions {
  maxTokensPerChunk?: number; // Target tokens per chunk (default: 380 tokens / ~1500 chars)
  overlapTokens?: number; // Token overlap between chunks (default: 50 tokens / ~200 chars)
  preserveHeaders?: boolean; // Prepend entity context headers to chunks
}

export interface ChunkableKnowledgeItem {
  id: string;
  title: string;
  originalTitle?: string;
  summary?: string;
  content?: string;
  knowledgeType: KnowledgeType;
  sourceSlug?: string;
  sourceName?: string;
  tags?: string[];
  countryCodes?: string[];
  publicationYear?: number;
  metadata?: Record<string, unknown>;
}

export class DocumentChunker {
  private readonly maxTokens: number;
  private readonly overlapTokens: number;
  private readonly preserveHeaders: boolean;

  constructor(options?: ChunkingOptions) {
    this.maxTokens = options?.maxTokensPerChunk ?? 380;
    this.overlapTokens = options?.overlapTokens ?? 50;
    this.preserveHeaders = options?.preserveHeaders ?? true;
  }

  /**
   * Approximate word-to-token heuristic (1 word ≈ 1.33 tokens)
   */
  public estimateTokens(text: string): number {
    if (!text || text.trim() === '') return 0;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words * 1.33);
  }

  /**
   * Chunks a knowledge item into coherent, searchable document chunks
   */
  public chunkItem(item: ChunkableKnowledgeItem): GeneratedChunk[] {
    const headerPrefix = this.preserveHeaders
      ? `[Entity: ${item.title} | Type: ${item.knowledgeType}${item.sourceName ? ` | Source: ${item.sourceName}` : ''}]\n`
      : '';

    // Primary text to chunk: concatenate summary and full content
    const fullBody = [item.summary, item.content]
      .filter((s) => s && s.trim().length > 0)
      .join('\n\n')
      .trim();

    // If text is brief (e.g. short caption or single paragraph), create a single chunk
    const totalTokens = this.estimateTokens(fullBody);
    if (totalTokens <= this.maxTokens || fullBody.length < 900) {
      const chunkText = `${headerPrefix}${fullBody || item.title}`.trim();
      const meta: ChunkMetadata = {
        chunkIndex: 0,
        totalChunks: 1,
        startChar: 0,
        endChar: fullBody.length,
        tokenCount: this.estimateTokens(chunkText),
        sourceSlug: item.sourceSlug,
        sourceName: item.sourceName,
        title: item.title,
        knowledgeType: item.knowledgeType,
        tags: item.tags,
        countryCodes: item.countryCodes,
        publicationYear: item.publicationYear,
      };

      return [
        {
          chunkIndex: 0,
          content: chunkText,
          tokenCount: meta.tokenCount,
          metadata: meta,
        },
      ];
    }

    // Split text into semantic sentences
    const sentences = this.splitIntoSentences(fullBody);
    const chunks: GeneratedChunk[] = [];

    let currentSentences: string[] = [];
    let currentTokens = 0;
    let charOffset = 0;
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceTokens = this.estimateTokens(sentence);

      if (currentTokens + sentenceTokens > this.maxTokens && currentSentences.length > 0) {
        // Finalize current chunk
        const chunkBody = currentSentences.join(' ');
        const chunkText = `${headerPrefix}${chunkBody}`.trim();
        const startChar = charOffset;
        const endChar = charOffset + chunkBody.length;

        chunks.push({
          chunkIndex,
          content: chunkText,
          tokenCount: this.estimateTokens(chunkText),
          metadata: {
            chunkIndex,
            totalChunks: 0, // Will be backfilled
            startChar,
            endChar,
            tokenCount: this.estimateTokens(chunkText),
            sourceSlug: item.sourceSlug,
            sourceName: item.sourceName,
            title: item.title,
            knowledgeType: item.knowledgeType,
            tags: item.tags,
            countryCodes: item.countryCodes,
            publicationYear: item.publicationYear,
          },
        });

        chunkIndex++;

        // Calculate overlap sentences for the next chunk
        let overlapTokensAcc = 0;
        const overlapSentences: string[] = [];

        for (let j = currentSentences.length - 1; j >= 0; j--) {
          const sentTokens = this.estimateTokens(currentSentences[j]);
          if (overlapTokensAcc + sentTokens <= this.overlapTokens) {
            overlapSentences.unshift(currentSentences[j]);
            overlapTokensAcc += sentTokens;
          } else {
            break;
          }
        }

        currentSentences = [...overlapSentences, sentence];
        currentTokens = overlapTokensAcc + sentenceTokens;
        charOffset = Math.max(0, endChar - overlapSentences.join(' ').length);
      } else {
        currentSentences.push(sentence);
        currentTokens += sentenceTokens;
      }
    }

    // Final trailing chunk
    if (currentSentences.length > 0) {
      const chunkBody = currentSentences.join(' ');
      const chunkText = `${headerPrefix}${chunkBody}`.trim();

      chunks.push({
        chunkIndex,
        content: chunkText,
        tokenCount: this.estimateTokens(chunkText),
        metadata: {
          chunkIndex,
          totalChunks: 0, // Will be backfilled
          startChar: charOffset,
          endChar: charOffset + chunkBody.length,
          tokenCount: this.estimateTokens(chunkText),
          sourceSlug: item.sourceSlug,
          sourceName: item.sourceName,
          title: item.title,
          knowledgeType: item.knowledgeType,
          tags: item.tags,
          countryCodes: item.countryCodes,
          publicationYear: item.publicationYear,
        },
      });
    }

    // Backfill totalChunks count
    for (const chunk of chunks) {
      chunk.metadata.totalChunks = chunks.length;
    }

    return chunks;
  }

  /**
   * Splits a long text into clean sentence units
   */
  private splitIntoSentences(text: string): string[] {
    const raw = text.split(/(?<=[.?!])\s+(?=[A-Z0-9"'])/);
    const cleaned: string[] = [];
    for (const s of raw) {
      const trimmed = s.trim();
      if (trimmed.length > 0) {
        cleaned.push(trimmed);
      }
    }
    return cleaned;
  }
}
