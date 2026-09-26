/**
 * AfroArchive - Kolex AI Knowledge Layer Indexer
 * Chunks knowledge items from Supabase, generates 768-dim embeddings,
 * and securely stores them in pgvector via store_chunk_and_embedding_rpc.
 *
 * Usage:
 *   npx tsx scripts/kolex/index-records.ts [--limit=5] [--provider=local|gemini|openai]
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentChunker } from '../../src/lib/kolex/chunker';
import { getEmbeddingProvider } from '../../src/lib/kolex/embeddings';

// 1. Environment Loading
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

// Parse CLI flags
const args = process.argv.slice(2);
let limit = 10;
let filterKeyword: string | null = null;
for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1], 10) || 10;
  }
  if (arg.startsWith('--filter=')) {
    filterKeyword = arg.split('=')[1];
  }
  if (arg.startsWith('--provider=')) {
    process.env.EMBEDDING_PROVIDER = arg.split('=')[1];
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gjtddtnonvyvvrwbscaq.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Key in environment.');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log('='.repeat(65));
  console.log('🏛️  AfroArchive - Kolex AI Knowledge Layer Indexer');
  console.log('='.repeat(65));

  const provider = getEmbeddingProvider();
  console.log(`📡 Embedding Provider: ${provider.providerName} (${provider.modelName})`);
  console.log(`📐 Target Vector Dimension: ${provider.dimension}`);
  console.log(`🔢 Max Records to Index: ${limit}`);
  if (filterKeyword) console.log(`🔍 Filter Keyword: "${filterKeyword}"`);
  console.log();

  let query = supabase
    .from('knowledge_items')
    .select(`
      id,
      title,
      slug,
      summary,
      content,
      knowledge_type,
      country_codes,
      source_id,
      attribution,
      license_type,
      sources (name, slug)
    `)
    .not('summary', 'is', null);

  if (filterKeyword) {
    query = query.ilike('title', `%${filterKeyword}%`);
  }

  const { data: items, error: fetchError } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fetchError || !items) {
    console.error('❌ Failed to fetch knowledge items from Supabase:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${items.length} knowledge items for indexing.\n`);

  let totalChunksCreated = 0;
  let totalEmbeddingsStored = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sourceInfo = item.sources as any;
    const sourceName = sourceInfo?.name || 'AfroArchive';
    const sourceSlug = sourceInfo?.slug || 'afroarchive';

    console.log(`[${i + 1}/${items.length}] Processing: "${item.title}"`);
    console.log(`   Type: ${item.knowledge_type} | Source: ${sourceName}`);

    // Chunk the item
    const chunker = new DocumentChunker({
      maxTokensPerChunk: 350,
      overlapTokens: 40,
      preserveHeaders: true,
    });

    const chunks = chunker.chunkItem({
      id: item.id,
      title: item.title,
      knowledgeType: item.knowledge_type,
      content: item.content || undefined,
      summary: item.summary || undefined,
      sourceName,
      sourceSlug,
      countryCodes: item.country_codes || [],
      metadata: {
        attribution: item.attribution,
        license_type: item.license_type,
      },
    });

    console.log(`   Generated ${chunks.length} chunk(s). Storing embeddings...`);

    for (const chunk of chunks) {
      // Generate 768-dim vector
      const embedding = await provider.generateEmbedding(chunk.content);

      if (embedding.length !== 768) {
        throw new Error(`Invalid embedding dimension: got ${embedding.length}, expected 768`);
      }

      // Store in pgvector via RPC
      const { data: chunkId, error: rpcError } = await supabase.rpc('store_chunk_and_embedding_rpc', {
        p_knowledge_item_id: item.id,
        p_chunk_index: chunk.chunkIndex,
        p_chunk_content: chunk.content,
        p_token_count: chunk.tokenCount,
        p_metadata: chunk.metadata,
        p_model_name: provider.modelName,
        p_embedding: embedding,
      });

      if (rpcError) {
        console.error(`   ❌ Failed to store chunk ${chunk.chunkIndex}:`, rpcError.message);
      } else {
        totalChunksCreated++;
        totalEmbeddingsStored++;
      }
    }

    console.log(`   ✓ Successfully indexed chunks for "${item.title}".\n`);
  }

  console.log('='.repeat(65));
  console.log(`🎉 Indexing complete!`);
  console.log(`   Total Chunks Stored:      ${totalChunksCreated}`);
  console.log(`   Total Embeddings Created: ${totalEmbeddingsStored}`);
  console.log('='.repeat(65));
}

main().catch((err) => {
  console.error('Fatal error during indexing:', err);
  process.exit(1);
});
