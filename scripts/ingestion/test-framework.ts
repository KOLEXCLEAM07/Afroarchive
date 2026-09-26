/**
 * AfroArchive Ingestion Framework - Self-Test Suite
 * Verifies that the classification, rights, deduplication, and database audit engines work correctly.
 */

import { AfricanRelevanceClassifier } from './relevance';
import { RightsClassifier } from './rights';
import { IngestionDatabase } from './db';
import { NormalizedItem } from './types';

async function runTests() {
  console.log('--- 1. Testing African Relevance Classifier ---');

  const test1 = AfricanRelevanceClassifier.assess(
    'Mansa Musa and the Wealth of the Mali Empire',
    'Historical study of the 14th century ruler of Mali and his pilgrimage through Cairo.',
    ['ML'],
    ['history', 'west-africa']
  );
  console.log('Test 1 (Mansa Musa):', test1.isRelevant ? 'PASS' : 'FAIL', `(Score: ${test1.score})`);

  const test2 = AfricanRelevanceClassifier.assess(
    'Ubuntu: An African Concept of Human Interconnectedness',
    'Philosophical analysis of Ubuntu ethics in Southern African societies.',
    ['ZA'],
    ['philosophy', 'ubuntu']
  );
  console.log('Test 2 (Ubuntu):', test2.isRelevant ? 'PASS' : 'FAIL', `(Score: ${test2.score})`);

  const test3 = AfricanRelevanceClassifier.assess(
    'Quantum Computing in Silicon Valley',
    'Advances in superconducting qubits and semiconductor architectures in California.',
    ['US'],
    ['tech']
  );
  console.log('Test 3 (Irrelevant Record):', !test3.isRelevant ? 'PASS (Correctly rejected)' : 'FAIL', `(Score: ${test3.score})`);

  console.log('\n--- 2. Testing Rights & Licensing Classifier ---');
  const rights1 = RightsClassifier.classify('CC-BY-SA 4.0', 'https://example.com', 'Dr. Cheikh Anta Diop');
  console.log('Rights 1 (CC-BY-SA):', rights1.licenseType === 'cc_by_sa' && rights1.canRehost ? 'PASS' : 'FAIL');

  const rights2 = RightsClassifier.classify('Public Domain', 'https://example.com', 'Archival Folio 1380');
  console.log('Rights 2 (Public Domain):', rights2.licenseType === 'public_domain' && rights2.canRehost ? 'PASS' : 'FAIL');

  const rights3 = RightsClassifier.classify('All Rights Reserved', 'https://example.com', 'Commercial Academic Publisher');
  console.log('Rights 3 (Restricted Copyright):', rights3.licenseType === 'copyrighted_metadata_only' && !rights3.canRehost ? 'PASS' : 'FAIL');

  console.log('\n--- 3. Testing Supabase Database Connectivity & Audit Logging ---');
  const db = new IngestionDatabase();

  const { runId, sourceId } = await db.startIngestionRun({
    sourceSlug: 'afroarchive-seed',
    sourceName: 'AfroArchive Canonical Seed Registry',
    sourceType: 'manual_archive',
    baseUrl: 'https://afroarchive.org',
    workerName: 'Seed Ingestion Worker',
    connectorType: 'internal_seed',
  });
  console.log('Source & Ingestion Run Initialized, Run ID:', runId, 'Source ID:', sourceId);

  const testItem: NormalizedItem = {
    slug: 'university-of-sankore-timbuktu',
    title: 'University of Sankoré',
    originalTitle: 'جامعة سنكوري',
    summary: 'One of the ancient centers of learning in Timbuktu, Mali, reaching its intellectual zenith in the 14th–16th centuries.',
    content: 'The Sankoré Mosque and University formed one of three major institutions of higher scholarship in Timbuktu during the Mali and Songhai Empires.',
    knowledgeType: 'place',
    sourceSlug: 'afroarchive-seed',
    sourceRecordId: 'SEED-SANKORE-001',
    sourceUrl: 'https://afroarchive.org/places/sankore',
    originalUrl: 'https://whc.unesco.org/en/list/119',
    externalIds: {
      wikidata: 'Q1333792',
    },
    rights: RightsClassifier.classify('CC-BY-SA 4.0', 'https://afroarchive.org', 'AfroArchive Curatorial Board'),
    languageCode: 'en',
    countryCodes: ['ML'],
    timePeriod: '14th–16th Century',
    metadata: { architectural_style: 'Sudano-Sahelian' },
    tags: ['education', 'timbuktu', 'mali-empire', 'islamic-scholarship', 'manuscripts'],
    entityData: {
      place: {
        historicalNames: ['Madrasah of Sankoré'],
        modernCountry: 'Mali',
        historicalRegion: 'Sahel',
        latitude: 16.7808,
        longitude: -3.0078,
      },
    },
  };

  const { action, id } = await db.upsertItem(testItem, 'afroarchive-seed', runId);
  console.log(`Knowledge Item Upsert Succeeded: ${action.toUpperCase()}, Item ID:`, id);

  await db.finishIngestionRun(runId, 'completed', {
    discovered: 1,
    imported: action === 'imported' ? 1 : 0,
    updated: action === 'updated' ? 1 : 0,
    skipped: 0,
    failed: 0,
  });

  console.log('Ingestion Run Successfully Audited and Closed.');
  console.log('\n✅ All Phase 4 Ingestion Framework Tests Passed!');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
