/**
 * One-off maintenance script: gives the Atlas somewhere to put states/kingdoms
 * and people.
 *
 * Neither importer ever populated `kingdoms_or_states.capital_place_id` or
 * `people.birth_place_id`, so the Atlas layers that join through those columns
 * rendered as empty (0 states, 0 people). This script resolves each entity's
 * capital city (Wikidata P36) or place of birth (Wikidata P19) to coordinates,
 * then links it to a `places` row.
 *
 * Where no matching place exists we insert a coordinate-only row with
 * `knowledge_item_id = null` and `metadata = { atlasRole: 'derived' }`. Those
 * never enter search/browse and are excluded from the Atlas "Places" layer, so
 * they only ever appear as the capital / birthplace of the entity that owns
 * them.
 *
 *   npx tsx scripts/cleanup/link-atlas-coordinates.ts            # dry run
 *   npx tsx scripts/cleanup/link-atlas-coordinates.ts --apply    # write
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  }
}

loadEnv();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!url || !key) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.');
  process.exit(1);
}

const apply = process.argv.includes('--apply');
const supabase = createClient(url, key, { auth: { persistSession: false } });

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
// Wikidata's user-agent policy requires a descriptive agent with a contact.
const USER_AGENT = 'AfroArchive-AtlasLinker/1.0 (open heritage archive; contact: editorial@afroarchive.example)';
const BATCH = 200;
const DELAY_MS = 1100;

interface Resolved { name: string; lat: number; lng: number }
interface KingdomRow {
  id: string;
  name: string;
  capital_place_id: string | null;
  knowledge_items: { external_ids: Record<string, string> | null } | null;
}
interface PersonRow { id: string; name: string; birth_place_id: string | null; wikidata_id: string | null }

function parsePoint(wkt: string): { lat: number; lng: number } | null {
  const m = /^Point\(([-\d.]+) ([-\d.]+)\)$/.exec(wkt);
  if (!m) return null;
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(select).order('id').range(from, from + 999);
    if (error) throw error;
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return rows;
}

/** Resolve QID → { name, coordinates } for a Wikidata property (P36 or P19). */
async function resolveViaWikidata(qids: string[], property: 'P36' | 'P19'): Promise<Map<string, Resolved>> {
  const out = new Map<string, Resolved>();
  for (let i = 0; i < qids.length; i += BATCH) {
    const chunk = qids.slice(i, i + BATCH);
    const query = `SELECT ?entity ?place ?placeLabel ?coord WHERE {
  VALUES ?entity { ${chunk.map(q => `wd:${q}`).join(' ')} }
  ?entity wdt:${property} ?place .
  ?place wdt:P625 ?coord .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
}`;
    const res = await fetch(SPARQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/sparql-results+json',
        'User-Agent': USER_AGENT,
      },
      body: new URLSearchParams({ query }).toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Wikidata SPARQL ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = await res.json() as { results: { bindings: Array<Record<string, { value: string }>> } };
    for (const b of json.results.bindings) {
      const entity = b.entity.value.replace('http://www.wikidata.org/entity/', '');
      if (out.has(entity)) continue; // first recorded value wins
      const pt = parsePoint(b.coord.value);
      if (!pt) continue;
      out.set(entity, { name: b.placeLabel?.value || entity, ...pt });
    }
    console.log(`  resolved ${out.size} / ${Math.min(i + BATCH, qids.length)} requested`);
    if (i + BATCH < qids.length) await new Promise(r => setTimeout(r, DELAY_MS));
  }
  return out;
}

async function main() {
  const kingdoms = await fetchAll<KingdomRow>(
    'kingdoms_or_states',
    'id, name, capital_place_id, knowledge_items(external_ids)',
  );
  const people = await fetchAll<PersonRow>('people', 'id, name, birth_place_id, wikidata_id');

  const qidOf = (e: string | null | undefined) => (e && /^Q\d+$/.test(e) ? e : null);
  const kingdomTargets = kingdoms
    .filter(k => !k.capital_place_id)
    .map(k => ({ id: k.id, name: k.name, qid: qidOf(k.knowledge_items?.external_ids?.wikidata) }))
    .filter(k => k.qid) as Array<{ id: string; name: string; qid: string }>;
  const peopleTargets = people
    .filter(p => !p.birth_place_id)
    .map(p => ({ id: p.id, name: p.name, qid: qidOf(p.wikidata_id) }))
    .filter(p => p.qid) as Array<{ id: string; name: string; qid: string }>;

  console.log(`Kingdoms without a capital: ${kingdomTargets.length} of ${kingdoms.length}`);
  console.log(`People without a birthplace: ${peopleTargets.length} of ${people.length}`);

  console.log('\nResolving capitals via Wikidata (P36)…');
  const capitals = await resolveViaWikidata([...new Set(kingdomTargets.map(k => k.qid))], 'P36');
  console.log('\nResolving birthplaces via Wikidata (P19)…');
  const birthplaces = await resolveViaWikidata([...new Set(peopleTargets.map(p => p.qid))], 'P19');

  const plans: Array<{ table: 'kingdoms_or_states' | 'people'; column: string; id: string; label: string; qid: string; place: Resolved }> = [];
  for (const k of kingdomTargets) {
    const place = capitals.get(k.qid);
    if (place) plans.push({ table: 'kingdoms_or_states', column: 'capital_place_id', id: k.id, label: k.name, qid: k.qid, place });
  }
  for (const p of peopleTargets) {
    const place = birthplaces.get(p.qid);
    if (place) plans.push({ table: 'people', column: 'birth_place_id', id: p.id, label: p.name, qid: p.qid, place });
  }

  const kingdomPlans = plans.filter(p => p.table === 'kingdoms_or_states');
  const peoplePlans = plans.filter(p => p.table === 'people');
  console.log(`\nResolved ${kingdomPlans.length} capitals and ${peoplePlans.length} birthplaces.`);
  for (const p of plans.slice(0, 40)) {
    console.log(`  ${p.label}  →  ${p.place.name} (${p.place.lat.toFixed(3)}, ${p.place.lng.toFixed(3)})`);
  }
  if (plans.length > 40) console.log(`  …and ${plans.length - 40} more.`);

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to write these links.');
    return;
  }

  // Index existing places by Wikidata QID so shared capitals/birthplaces reuse one row.
  const places = await fetchAll<{ id: string; wikidata_id: string | null }>('places', 'id, wikidata_id');
  const placeByQid = new Map<string, string>();
  for (const place of places) if (place.wikidata_id) placeByQid.set(place.wikidata_id, place.id);
  console.log(`\nIndexed ${placeByQid.size} existing places by Wikidata QID.`);

  let created = 0;
  let linked = 0;
  for (const plan of plans) {
    let placeId = placeByQid.get(plan.qid);
    if (!placeId) {
      const { data, error } = await supabase
        .from('places')
        .insert({
          name: plan.place.name,
          latitude: plan.place.lat,
          longitude: plan.place.lng,
          wikidata_id: plan.qid,
          metadata: { atlasRole: 'derived' },
        })
        .select('id')
        .single();
      if (error) {
        console.error(`  ! could not create place for ${plan.label} (${plan.qid}): ${error.message}`);
        continue;
      }
      placeId = data.id as string;
      placeByQid.set(plan.qid, placeId);
      created += 1;
    }
    const { error } = await supabase.from(plan.table).update({ [plan.column]: placeId }).eq('id', plan.id);
    if (error) {
      console.error(`  ! could not link ${plan.label}: ${error.message}`);
      continue;
    }
    linked += 1;
  }
  console.log(`\nLinked ${linked} entities; created ${created} new places.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
