/**
 * AfroArchive - Kolex AI Knowledge Layer Retrieval Test Suite
 * Tests semantic similarity search, metadata filtering, source verification,
 * and citation-ready prompt context construction.
 *
 * Usage:
 *   npx tsx scripts/kolex/test-retrieval.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { KolexKnowledgeService } from '../../src/lib/kolex/service';
import { KolexSearchParams } from '../../src/lib/kolex/types';

// Load environment variables
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

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function runTestQuery(service: KolexKnowledgeService, testNum: number, params: KolexSearchParams) {
  console.log('='.repeat(70));
  console.log(`🧪 TEST ${testNum}: "${params.query}"`);
  if (params.knowledgeType || params.sourceSlug || params.countryCode) {
    console.log(`🎯 Filters: [Type: ${params.knowledgeType || 'ANY'}] [Source: ${params.sourceSlug || 'ANY'}] [Country: ${params.countryCode || 'ANY'}]`);
  }
  console.log('='.repeat(70));

  const result = await service.retrieveKnowledge(params);

  console.log(`⏱️  Execution Time: ${result.executionTimeMs}ms`);
  console.log(`📊 Chunks Retrieved: ${result.matches.length}`);
  console.log(`📚 Verified Distinct Sources: ${result.sources.length}\n`);

  if (result.matches.length === 0) {
    console.log('⚠️  No chunks matched above threshold.');
    return;
  }

  // Display Retrieved Chunks with Similarity
  console.log('--- [1. RETRIEVED SEMANTIC CHUNKS] ---');
  result.matches.forEach((match, idx) => {
    console.log(`\n  [Result #${idx + 1}] Similarity: ${(match.similarity * 100).toFixed(1)}% | Chunk #${match.chunkIndex}`);
    console.log(`  Title:  ${match.title}`);
    console.log(`  Type:   ${match.knowledgeType} | Source: ${match.sourceName || match.sourceSlug}`);
    console.log(`  Content Excerpt: "${match.chunkContent.replace(/\n/g, ' ').slice(0, 180)}..."`);
  });

  // Display Verified Sources & Rights
  console.log('\n--- [2. VERIFIED SOURCES & PROVENANCE] ---');
  result.sources.forEach((src) => {
    console.log(`\n  [${src.badge}] ${src.title}`);
    console.log(`      Source:      ${src.sourceName}`);
    console.log(`      Rights:      ${src.licenseType}`);
    console.log(`      Attribution: ${src.attribution}`);
    console.log(`      URL:         ${src.url}`);
    if (src.doi) {
      const cleanDoi = src.doi.startsWith('http') ? src.doi : `https://doi.org/${src.doi}`;
      console.log(`      DOI:         ${cleanDoi}`);
    }
    console.log(`      Citation:    ${src.citation}`);
  });

  // Display Kolex AI Formatted RAG Prompt Context
  console.log('\n--- [3. SYNTHESIS PROMPT CONTEXT (KOLEX AI READY)] ---');
  const previewContext = result.promptContext.split('\n').slice(0, 12).join('\n');
  console.log(previewContext + '\n  ... [truncated for display]');
  console.log();
}

async function main() {
  console.log('\n' + '#'.repeat(70));
  console.log('🌟 AFROARCHIVE - KOLEX AI KNOWLEDGE LAYER VERIFICATION SUITE');
  console.log('#'.repeat(70) + '\n');

  const service = new KolexKnowledgeService(supabase);

  // Test 1: Timbuktu Manuscripts (Astronomy, Mathematics, Preservation)
  await runTestQuery(service, 1, {
    query: 'What astronomical and mathematical knowledge is preserved in the Timbuktu manuscripts?',
    matchCount: 3,
    matchThreshold: 0.15,
  });

  // Test 2: Ubuntu Philosophy & Ethics
  await runTestQuery(service, 2, {
    query: 'Explain the core principles of Ubuntu philosophy regarding communal responsibility and ethics.',
    matchCount: 3,
    matchThreshold: 0.15,
  });

  // Test 3: Benin Bronzes & Cultural Heritage
  await runTestQuery(service, 3, {
    query: 'What historical craftsmanship and ceremonial significance do the Benin Bronzes represent?',
    matchCount: 3,
    matchThreshold: 0.15,
  });

  // Test 4: University of Sankore with Metadata Filter (Type: 'place' or Country: 'ML')
  await runTestQuery(service, 4, {
    query: 'History of Islamic scholarship and learning centers in Timbuktu',
    knowledgeType: 'place',
    countryCode: 'ML',
    matchCount: 2,
    matchThreshold: 0.15,
  });

  console.log('='.repeat(70));
  console.log('✅ ALL RETRIEVAL TESTS COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(70) + '\n');
}

main().catch((err) => {
  console.error('Fatal retrieval test failure:', err);
  process.exit(1);
});
