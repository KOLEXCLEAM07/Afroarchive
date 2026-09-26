/**
 * AfroArchive - Kolex AI Embedding Provider Interface
 * Configurable multi-provider embedding generator supporting Google Gemini, OpenAI,
 * Ollama (local), and a deterministic semantic fallback vector engine.
 *
 * All providers produce 768-dimensional normalized float vectors matching pgvector vector(768).
 */

import { EmbeddingProvider, EmbeddingProviderType } from './types';

export const TARGET_EMBEDDING_DIMENSION = 768;

/**
 * 1. Google Gemini Embedding Provider (text-embedding-004)
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly providerName: EmbeddingProviderType = 'gemini';
  readonly modelName: string = 'text-embedding-004';
  readonly dimension: number = TARGET_EMBEDDING_DIMENSION;
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key || key === 'placeholder-gemini-key') {
      throw new Error('Valid GEMINI_API_KEY is required for Gemini embeddings.');
    }
    this.apiKey = key;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:embedContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${this.modelName}`,
        content: { parts: [{ text: text.slice(0, 8000) }] },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Embedding API Error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as { embedding: { values: number[] } };
    return data.embedding.values;
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.generateEmbedding(text));
    }
    return results;
  }
}

/**
 * 2. OpenAI Embedding Provider (text-embedding-3-small with 768 dimensions)
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly providerName: EmbeddingProviderType = 'openai';
  readonly modelName: string = 'text-embedding-3-small';
  readonly dimension: number = TARGET_EMBEDDING_DIMENSION;
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('Valid OPENAI_API_KEY is required for OpenAI embeddings.');
    }
    this.apiKey = key;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: text.slice(0, 8000),
        model: this.modelName,
        dimensions: this.dimension, // Explicitly request 768 dimensions
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Embedding API Error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data[0].embedding;
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts.map((t) => t.slice(0, 8000)),
        model: this.modelName,
        dimensions: this.dimension,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Embedding API Error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((d) => d.embedding);
  }
}

/**
 * 3. Local Semantic Embedding Engine (768 dimensions, zero external cost, deterministic)
 * Uses high-dimensional subword hash projection with L2 normalization and domain weighting.
 */
export class LocalSemanticEmbeddingProvider implements EmbeddingProvider {
  readonly providerName: EmbeddingProviderType = 'local';
  readonly modelName: string = 'afroarchive-semantic-local-768';
  readonly dimension: number = TARGET_EMBEDDING_DIMENSION;

  /**
   * Deterministic Murmur-style 32-bit hash
   */
  private hashString(str: string, seed: number = 0): number {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)) % 0x7fffffff;
  }

  private static readonly STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
    'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
    'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
    'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'so', 'some', 'such', 'than', 'that',
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
    'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours'
  ]);

  async generateEmbedding(text: string): Promise<number[]> {
    const vec = new Float64Array(this.dimension);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const allTokens = cleaned.split(/\s+/).filter((t) => t.length > 1);

    if (allTokens.length === 0) {
      vec[0] = 1.0;
      return Array.from(vec);
    }

    // 1. Unigram projection with content term weighting
    for (let i = 0; i < allTokens.length; i++) {
      const token = allTokens[i];
      const isStop = LocalSemanticEmbeddingProvider.STOP_WORDS.has(token);
      const weight = isStop ? 0.15 : 2.5;

      const h = this.hashString(token, 42);
      const idx = Math.abs(h) % this.dimension;
      const sign = (h & 1) === 0 ? 1.0 : -1.0;
      vec[idx] += sign * weight;

      // 2. Character n-gram projection (trigrams for non-stopwords)
      if (!isStop && token.length >= 3) {
        for (let j = 0; j < token.length - 2; j++) {
          const tri = token.slice(j, j + 3);
          const triH = this.hashString(tri, 101);
          const triIdx = Math.abs(triH) % this.dimension;
          const triSign = (triH & 1) === 0 ? 0.8 : -0.8;
          vec[triIdx] += triSign;
        }
      }

      // 3. Meaningful Bigram projection (skip stopword-stopword pairs)
      if (i < allTokens.length - 1) {
        const nextToken = allTokens[i + 1];
        const nextIsStop = LocalSemanticEmbeddingProvider.STOP_WORDS.has(nextToken);
        if (!isStop || !nextIsStop) {
          const bigram = `${token}_${nextToken}`;
          const biH = this.hashString(bigram, 73);
          const biIdx = Math.abs(biH) % this.dimension;
          const biSign = (biH & 1) === 0 ? 2.2 : -2.2;
          vec[biIdx] += biSign;
        }
      }
    }

    // 4. L2 Normalization so cosine distance is mathematically accurate
    let sumSq = 0;
    for (let k = 0; k < this.dimension; k++) {
      sumSq += vec[k] * vec[k];
    }
    const norm = Math.sqrt(sumSq) || 1.0;

    const result: number[] = new Array(this.dimension);
    for (let k = 0; k < this.dimension; k++) {
      result[k] = parseFloat((vec[k] / norm).toFixed(6));
    }

    return result;
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.generateEmbedding(t)));
  }
}

/**
 * Factory function to instantiate the configured embedding provider
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  const configuredProvider = (process.env.EMBEDDING_PROVIDER || '').toLowerCase().trim();

  // Explicit provider choice
  if (configuredProvider === 'gemini') {
    return new GeminiEmbeddingProvider();
  }
  if (configuredProvider === 'openai') {
    return new OpenAIEmbeddingProvider();
  }
  if (configuredProvider === 'local') {
    return new LocalSemanticEmbeddingProvider();
  }

  // Automatic detection based on available credentials
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'placeholder-gemini-key') {
    try {
      return new GeminiEmbeddingProvider(geminiKey);
    } catch {
      // Fallback if key is invalid
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      return new OpenAIEmbeddingProvider(process.env.OPENAI_API_KEY);
    } catch {
      // Fallback
    }
  }

  // Default to reliable Local semantic provider
  return new LocalSemanticEmbeddingProvider();
}
