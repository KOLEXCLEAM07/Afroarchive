/**
 * AfroArchive Ingestion Framework - Wikidata Importer
 *
 * Topics (--topic=...):
 *   states  historical countries / kingdoms / empires in Africa (default)
 *   sites   archaeological sites and UNESCO World Heritage Sites in African countries
 *   rulers  heads of state / monarchs of African states (born before 1960)
 *   people  notable African scholars, writers and scientists (≥ 15 sitelinks)
 *
 * Each topic works in two phases so pagination is stable and queries stay cheap:
 *   1. a (cached) list of matching QIDs, sorted numerically;
 *   2. a details query for one page of QIDs (VALUES ?item { ... }).
 * Only items with an English Wikipedia article are included.
 *
 * Licensing: Wikidata statements are CC0. When the English description is very
 * short, the English Wikipedia lead (CC BY-SA 4.0) is stored in `content` and the
 * record's rights become CC BY-SA 4.0 ("Wikipedia contributors"). Image licences
 * are looked up on Wikimedia Commons; if unknown the media is marked
 * licenseType 'unknown' / canRehost false.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions, RightsAssessment } from '../types';
import { RightsClassifier } from '../rights';
import { AFRICAN_COUNTRY_CODES } from '../relevance';
import { fetchJson, Throttle, stripHtml, kebab, guessImageMime, leadSentences } from '../http';

export type WikidataTopic = 'states' | 'sites' | 'rulers' | 'people';
export const WIKIDATA_TOPICS: WikidataTopic[] = ['states', 'sites', 'rulers', 'people'];

type Binding = Record<string, { value: string } | undefined>;

export interface WikidataEntityRecord {
  topic: WikidataTopic;
  qid: string;
  binding: Binding;
  imageLicense?: CommonsLicense;
  wikipediaExtract?: string;
}

interface CommonsLicense {
  licenseShortName?: string;
  artist?: string;
  usageTerms?: string;
}

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const AFRICAN_ISO = Array.from(AFRICAN_COUNTRY_CODES);
const ISO_VALUES = AFRICAN_ISO.map((c) => `"${c}"`).join(' ');
const EN_ARTICLE = '?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .';
const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';
const CC_BY_SA_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

const PEOPLE_OCCUPATIONS = [
  'Q4964182', // philosopher
  'Q201788', // historian
  'Q36180', // writer
  'Q49757', // poet
  'Q901', // scientist
  'Q170790', // mathematician
  'Q11063', // astronomer
  'Q39631', // physician
];

const RULER_POSITION_CLASSES = [
  'Q116', // monarch
  'Q48352', // head of state
  'Q2285706', // head of government
];

const qidOf = (uri: string) => uri.split('/').pop() || '';
const qidNum = (qid: string) => parseInt(qid.slice(1), 10);
const isQid = (s: string) => /^Q\d+$/.test(s);

/** Parses a WDQS timeValue + precision into a historical year (BCE negative). */
function parseYear(value?: string, precision?: string): number | undefined {
  if (!value) return undefined;
  if (precision !== undefined && Number(precision) < 9) return undefined; // coarser than a year
  const m = value.match(/^([+-]?)(\d+)-/);
  if (!m) return undefined;
  let year = parseInt(m[2], 10) * (m[1] === '-' ? -1 : 1);
  // WDQS uses astronomical numbering (0 = 1 BCE, -99 = 100 BCE); convert to historical.
  if (year <= 0) year = year - 1;
  return year;
}

/**
 * Picks a year from GROUP_CONCAT'ed "value@precision@rank" triples: best rank only,
 * and only if all best-rank statements agree on the year (never guess between them).
 */
function pickDate(concat?: string): { year?: number; approximate: boolean } {
  if (!concat) return { approximate: false };
  const entries = concat.split('|').map((t) => {
    const [value, precision, rank, circa] = t.split('@');
    return { value, precision, rank: rank || '', circa: circa === 'circa' };
  });
  const preferred = entries.filter((t) => t.rank.endsWith('PreferredRank'));
  const pool = preferred.length ? preferred : entries.filter((t) => t.rank.endsWith('NormalRank'));
  const years = new Set(pool.map((t) => parseYear(t.value, t.precision)));
  if (years.size !== 1) return { approximate: pool.length > 0 };
  const year = [...years][0];
  // "circa"-type qualifiers, or ancient (BCE) dates, are flagged as approximate.
  return { year, approximate: pool.some((t) => t.circa) || (year !== undefined && year < 0) };
}

function pickYear(concat?: string): number | undefined {
  return pickDate(concat).year;
}

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

function formatSpan(start?: number, end?: number, startWord = 'from', endWord = 'until'): string | undefined {
  if (start !== undefined && end !== undefined) return `${formatYear(start)}–${formatYear(end)}`;
  if (start !== undefined) return `${startWord} ${formatYear(start)}`;
  if (end !== undefined) return `${endWord} ${formatYear(end)}`;
  return undefined;
}

const splitList = (s?: string) =>
  (s || '')
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean);

const uniq = <T>(arr: T[]) => Array.from(new Set(arr));

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function datePattern(prop: string, name: string): string {
  return `OPTIONAL {
    ?item p:${prop} ?${name}St . ?${name}St psv:${prop} ?${name}V ; wikibase:rank ?${name}Rank .
    ?${name}V wikibase:timeValue ?${name}T ; wikibase:timePrecision ?${name}P .
    FILTER(?${name}Rank != wikibase:DeprecatedRank)
    OPTIONAL { ?${name}St pq:P1480 ?${name}Circ . }
    BIND(CONCAT(STR(?${name}T), "@", STR(?${name}P), "@", STR(?${name}Rank), "@", IF(BOUND(?${name}Circ), "circa", "")) AS ?${name}Pair)
  }`;
}

function labelPattern(path: string, name: string): string {
  return `OPTIONAL { ?item ${path} ?${name}E . ?${name}E rdfs:label ?${name}L . FILTER(LANG(?${name}L) = "en") }`;
}

export class WikidataImporter extends BaseImporter<WikidataEntityRecord> {
  readonly name = 'Wikidata Importer';
  readonly sourceSlug = 'wikidata';
  readonly sourceName = 'Wikidata Knowledge Base';
  readonly connectorType = 'wikidata_sparql';
  readonly baseUrl = SPARQL_ENDPOINT;

  protected batchSize = 50;

  private readonly sparqlThrottle = new Throttle(1500);
  private readonly wikiThrottle = new Throttle(1000);
  private readonly idCache = new Map<WikidataTopic, string[]>();
  private siteState = { countryIdx: 0, ids: [] as string[], seen: new Set<string>() };
  private useWikipedia = true;

  // -------------------------------------------------------------------------
  // Topic & cursor handling (cursor format: "<topic>:<offset>")
  // -------------------------------------------------------------------------

  private resolveTopic(options?: ConnectorOptions): WikidataTopic {
    const t = (options?.topic || 'states').toLowerCase().trim() as WikidataTopic;
    if (!WIKIDATA_TOPICS.includes(t)) {
      throw new Error(`Unknown Wikidata topic "${options?.topic}". Use one of: ${WIKIDATA_TOPICS.join(', ')}`);
    }
    return t;
  }

  /** Parses "states:400;sites:1200" (or a single "topic:offset") into a map. */
  private parseCheckpointMap(saved?: string | number | null): Record<string, number> {
    const map: Record<string, number> = {};
    if (saved === undefined || saved === null) return map;
    for (const part of String(saved).split(';')) {
      const m = part.trim().match(/^([a-z]+):(\d+)$/);
      if (m) map[m[1]] = parseInt(m[2], 10);
    }
    return map;
  }

  private parseOffset(cursor: string | number | undefined, topic: WikidataTopic): number {
    if (cursor === undefined || cursor === null || cursor === '') return 0;
    if (typeof cursor === 'number') return cursor;
    if (/^\d+$/.test(cursor)) return parseInt(cursor, 10);
    return this.parseCheckpointMap(cursor)[topic] ?? 0;
  }

  protected resolveResumeCursor(saved: string | number, options: ConnectorOptions): string | number | undefined {
    const topic = this.resolveTopic(options);
    const offset = this.parseCheckpointMap(saved)[topic];
    return offset !== undefined ? `${topic}:${offset}` : undefined;
  }

  protected encodeCheckpoint(
    cursor: string | number | null,
    saved: string | number | null | undefined,
    options: ConnectorOptions
  ): string | number | null {
    const topic = this.resolveTopic(options);
    const map = this.parseCheckpointMap(saved);
    if (cursor !== null) map[topic] = this.parseOffset(cursor, topic);
    const entries = Object.entries(map);
    return entries.length ? entries.map(([k, v]) => `${k}:${v}`).join(';') : null;
  }

  protected isTrustedAfricanSource(): boolean {
    // Every topic query is restricted to African states / countries.
    return true;
  }

  // -------------------------------------------------------------------------
  // SPARQL
  // -------------------------------------------------------------------------

  private async sparql(query: string, timeoutMs = 75000): Promise<Binding[]> {
    const json = await fetchJson<{ results: { bindings: Binding[] } }>(SPARQL_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/sparql-results+json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `format=json&query=${encodeURIComponent(query)}`,
      timeoutMs,
      retries: 3,
      throttle: this.sparqlThrottle,
    });
    return json.results?.bindings || [];
  }

  private sortedQids(rows: Binding[], key = 'item'): string[] {
    return uniq(rows.map((r) => qidOf(r[key]?.value || '')).filter(isQid)).sort((a, b) => qidNum(a) - qidNum(b));
  }

  private async listStates(): Promise<string[]> {
    const rows = await this.sparql(`SELECT DISTINCT ?item WHERE {
      ?item wdt:P31/wdt:P279* wd:Q3024240 .
      { ?item wdt:P30 wd:Q15 . }
      UNION { VALUES ?iso { ${ISO_VALUES} } ?c wdt:P297 ?iso . ?item wdt:P17 ?c . }
      UNION { VALUES ?iso2 { ${ISO_VALUES} } ?c2 wdt:P297 ?iso2 . ?item wdt:P36/wdt:P17 ?c2 . }
      FILTER NOT EXISTS { ?item wdt:P30 wd:Q46 . }
      # Empires that also span Asia (Sasanian, Abbasid, ...) only count if a capital lay in Africa.
      FILTER(NOT EXISTS { ?item wdt:P30 wd:Q48 . } || EXISTS { ?item wdt:P36/wdt:P17/wdt:P297 ?capIso . FILTER(?capIso IN (${AFRICAN_ISO.map((c) => `"${c}"`).join(', ')})) })
      ${EN_ARTICLE}
    }`);
    return this.sortedQids(rows);
  }

  private async listRulers(): Promise<string[]> {
    console.log('   Building ruler list: African jurisdictions → ruling positions → office holders...');
    const jurRows = await this.sparql(`SELECT DISTINCT ?item WHERE {
      { ?item wdt:P30 wd:Q15 . ?item wdt:P31/wdt:P279* wd:Q3024240 . FILTER NOT EXISTS { ?item wdt:P30 wd:Q46 . } }
      UNION { VALUES ?iso { ${ISO_VALUES} } ?item wdt:P297 ?iso . }
    }`);
    const jurValues = this.sortedQids(jurRows).map((q) => `wd:${q}`).join(' ');

    const posRows = await this.sparql(`SELECT DISTINCT ?item WHERE {
      VALUES ?jur { ${jurValues} }
      ?item wdt:P1001 ?jur .
      VALUES ?r { ${RULER_POSITION_CLASSES.map((q) => `wd:${q}`).join(' ')} }
      ?item wdt:P279* ?r .
    }`);
    const posValues = this.sortedQids(posRows).map((q) => `wd:${q}`).join(' ');

    // Excludes foreign sovereigns who merely held an African title (e.g. "Queen of Kenya",
    // "Pharaoh" for Alexander the Great): if citizenship is recorded, one must be African.
    const holderRows = posValues
      ? await this.sparql(`SELECT DISTINCT ?item WHERE {
          VALUES ?pos { ${posValues} }
          ?item wdt:P39 ?pos ; wdt:P31 wd:Q5 ; wdt:P569 ?birth .
          FILTER(YEAR(?birth) < 1960)
          FILTER(NOT EXISTS { ?item wdt:P27 ?anyCit . } || EXISTS { VALUES ?afCit { ${jurValues} } ?item wdt:P27 ?afCit . })
          ${EN_ARTICLE}
        }`)
      : [];

    const monarchRows = await this.sparql(`SELECT DISTINCT ?item WHERE {
      VALUES ?jur { ${jurValues} }
      ?item wdt:P106 wd:Q116 ; wdt:P27 ?jur ; wdt:P31 wd:Q5 ; wdt:P569 ?birth .
      FILTER(YEAR(?birth) < 1960)
      ${EN_ARTICLE}
    }`);

    return this.sortedQids([...holderRows, ...monarchRows]);
  }

  private async listPeople(): Promise<string[]> {
    console.log('   Building notable-people list (queried in country groups)...');
    const all: Binding[] = [];
    const occ = PEOPLE_OCCUPATIONS.map((q) => `wd:${q}`).join(' ');
    for (let i = 0; i < AFRICAN_ISO.length; i += 9) {
      const group = AFRICAN_ISO.slice(i, i + 9).map((c) => `"${c}"`).join(' ');
      const rows = await this.sparql(`SELECT DISTINCT ?item WHERE {
        VALUES ?iso { ${group} }
        ?c wdt:P297 ?iso .
        ?item wdt:P27 ?c .
        VALUES ?occ { ${occ} }
        ?item wdt:P106 ?occ .
        ?item wikibase:sitelinks ?links . FILTER(?links >= 15)
        ${EN_ARTICLE}
      }`);
      all.push(...rows);
    }
    return this.sortedQids(all);
  }

  /** Sites are listed one African country at a time (lazily) to keep each query fast. */
  private async ensureSites(needed: number): Promise<void> {
    const st = this.siteState;
    while (st.ids.length < needed && st.countryIdx < AFRICAN_ISO.length) {
      const iso = AFRICAN_ISO[st.countryIdx];
      const rows = await this.sparql(`SELECT DISTINCT ?item WHERE {
        ?c wdt:P297 "${iso}" .
        ?item wdt:P17 ?c .
        { ?item wdt:P1435 wd:Q9259 . } UNION { ?item wdt:P31 ?type . ?type wdt:P279* wd:Q839954 . }
        ?item wdt:P625 ?coords .
        ${EN_ARTICLE}
      }`);
      const fresh = this.sortedQids(rows).filter((q) => !st.seen.has(q));
      fresh.forEach((q) => st.seen.add(q));
      st.ids.push(...fresh);
      st.countryIdx++;
      console.log(`   Sites in ${iso}: ${fresh.length} (running total ${st.ids.length})`);
    }
  }

  private async getIds(topic: WikidataTopic, needed: number): Promise<{ ids: string[]; complete: boolean }> {
    if (topic === 'sites') {
      await this.ensureSites(needed);
      return { ids: this.siteState.ids, complete: this.siteState.countryIdx >= AFRICAN_ISO.length };
    }
    let ids = this.idCache.get(topic);
    if (!ids) {
      ids = topic === 'states' ? await this.listStates() : topic === 'rulers' ? await this.listRulers() : await this.listPeople();
      this.idCache.set(topic, ids);
      console.log(`   ${ids.length} Wikidata items match topic "${topic}".`);
    }
    return { ids, complete: true };
  }

  private detailsQuery(topic: WikidataTopic, qids: string[]): string {
    const common = {
      select: `?item (SAMPLE(?label) AS ?label) (SAMPLE(?desc) AS ?desc) (SAMPLE(?article) AS ?article)
        (SAMPLE(?image) AS ?image) (SAMPLE(?links) AS ?links)`,
      where: `
        ?item rdfs:label ?label . FILTER(LANG(?label) = "en")
        OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "en") }
        OPTIONAL { ${EN_ARTICLE} }
        OPTIONAL { ?item wdt:P18 ?image . }
        OPTIONAL { ?item wikibase:sitelinks ?links . }`,
    };
    const concat = (v: string, as: string) => `(GROUP_CONCAT(DISTINCT ?${v}; separator="|") AS ?${as})`;

    let select = '';
    let where = '';
    if (topic === 'states') {
      select = `${concat('incPair', 'inception')} ${concat('disPair', 'dissolution')} ${concat('capL', 'capital')}
        (SAMPLE(?capCoords) AS ?capitalCoords) ${concat('govL', 'government')} ${concat('ctyL', 'countries')} ${concat('ctyIso', 'countryIso')}
        ${concat('repL', 'replacedBy')} ${concat('prevL', 'replaces')} ${concat('capIso', 'capitalIso')}`;
      where = `${datePattern('P571', 'inc')} ${datePattern('P576', 'dis')}
        OPTIONAL { ?item wdt:P36 ?cap . ?cap rdfs:label ?capL . FILTER(LANG(?capL) = "en") OPTIONAL { ?cap wdt:P625 ?capCoords . } }
        ${labelPattern('wdt:P122', 'gov')}
        OPTIONAL { ?item wdt:P17 ?cty . ?cty rdfs:label ?ctyL . FILTER(LANG(?ctyL) = "en") OPTIONAL { ?cty wdt:P297 ?ctyIso . } }
        ${labelPattern('wdt:P1366', 'rep')} ${labelPattern('wdt:P1365', 'prev')}
        OPTIONAL { ?item wdt:P36/wdt:P17/wdt:P297 ?capIso . }`;
    } else if (topic === 'sites') {
      select = `(SAMPLE(?coords) AS ?coords) ${concat('ctyL', 'countries')} ${concat('ctyIso', 'countryIso')}
        (SAMPLE(?unescoFlag) AS ?unesco) ${concat('typeL', 'types')} (SAMPLE(?archFlag) AS ?archaeological)`;
      where = `OPTIONAL { ?item wdt:P625 ?coords . }
        OPTIONAL { ?item wdt:P17 ?cty . ?cty rdfs:label ?ctyL . FILTER(LANG(?ctyL) = "en") OPTIONAL { ?cty wdt:P297 ?ctyIso . } }
        OPTIONAL { ?item wdt:P1435 wd:Q9259 . BIND("yes" AS ?unescoFlag) }
        OPTIONAL { ?item wdt:P31 ?archT . ?archT wdt:P279* wd:Q839954 . BIND("yes" AS ?archFlag) }
        ${labelPattern('wdt:P31', 'type')}`;
    } else {
      select = `${concat('birthPair', 'birth')} ${concat('deathPair', 'death')} ${concat('bpL', 'birthplace')}
        ${concat('occL', 'occupations')} ${concat('alias', 'aliases')} ${concat('citIso', 'citizenshipIso')} ${concat('citL', 'citizenship')}
        ${concat('bpIso', 'birthplaceIso')} ${topic === 'rulers' ? concat('posL', 'positions') : ''}`;
      where = `${datePattern('P569', 'birth')} ${datePattern('P570', 'death')}
        ${labelPattern('wdt:P19', 'bp')} ${labelPattern('wdt:P106', 'occ')}
        OPTIONAL { ?item skos:altLabel ?alias . FILTER(LANG(?alias) = "en") }
        OPTIONAL { ?item wdt:P19/wdt:P17/wdt:P297 ?bpIso . }
        OPTIONAL { ?item wdt:P27 ?cit . ?cit rdfs:label ?citL . FILTER(LANG(?citL) = "en") OPTIONAL { ?cit wdt:P297 ?citIso . } }
        ${topic === 'rulers' ? labelPattern('wdt:P39', 'pos') : ''}`;
    }

    return `SELECT ${common.select} ${select} WHERE {
      VALUES ?item { ${qids.map((q) => `wd:${q}`).join(' ')} }
      ${common.where}
      ${where}
    } GROUP BY ?item`;
  }

  // -------------------------------------------------------------------------
  // Commons licences & Wikipedia summaries
  // -------------------------------------------------------------------------

  private commonsFileName(imageUri?: string): string | undefined {
    if (!imageUri) return undefined;
    const last = imageUri.split('/Special:FilePath/').pop();
    if (!last) return undefined;
    try {
      return decodeURIComponent(last).replace(/_/g, ' ');
    } catch {
      return last.replace(/_/g, ' ');
    }
  }

  private async fetchCommonsLicenses(fileNames: string[]): Promise<Map<string, CommonsLicense>> {
    const result = new Map<string, CommonsLicense>();
    if (!fileNames.length) return result;
    try {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'imageinfo',
        iiprop: 'extmetadata',
        iiextmetadatafilter: 'LicenseShortName|Artist|UsageTerms',
        titles: fileNames.map((f) => `File:${f}`).join('|'),
      });
      const json = await fetchJson<{
        query?: {
          normalized?: Array<{ from: string; to: string }>;
          pages?: Record<string, { title: string; imageinfo?: Array<{ extmetadata?: Record<string, { value: string }> }> }>;
        };
      }>('https://commons.wikimedia.org/w/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        throttle: this.wikiThrottle,
      });
      const byTitle = new Map<string, CommonsLicense>();
      for (const page of Object.values(json.query?.pages || {})) {
        const meta = page.imageinfo?.[0]?.extmetadata;
        if (!meta) continue;
        byTitle.set(page.title, {
          licenseShortName: stripHtml(meta.LicenseShortName?.value) || undefined,
          artist: stripHtml(meta.Artist?.value) || undefined,
          usageTerms: stripHtml(meta.UsageTerms?.value) || undefined,
        });
      }
      const normalized = new Map((json.query?.normalized || []).map((n) => [n.from, n.to]));
      for (const f of fileNames) {
        const asked = `File:${f}`;
        const lic = byTitle.get(normalized.get(asked) || asked);
        if (lic) result.set(f, lic);
      }
    } catch (err) {
      console.warn(`   ⚠️  Commons licence lookup failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    return result;
  }

  private articleTitle(articleUrl: string): string | undefined {
    const raw = articleUrl.split('/wiki/').pop();
    if (!raw) return undefined;
    try {
      return decodeURIComponent(raw).replace(/_/g, ' ');
    } catch {
      return raw.replace(/_/g, ' ');
    }
  }

  /**
   * Fetches plain-text lead sections for many articles at once via the Action API
   * (20 titles per request), keyed by the requested title.
   */
  private async fetchWikipediaExtracts(titles: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (let i = 0; i < titles.length; i += 20) {
      const chunk = titles.slice(i, i + 20);
      try {
        const params = new URLSearchParams({
          action: 'query',
          format: 'json',
          prop: 'extracts|pageprops',
          exintro: '1',
          explaintext: '1',
          exlimit: '20',
          ppprop: 'disambiguation',
          redirects: '1',
          titles: chunk.join('|'),
        });
        const json = await fetchJson<{
          query?: {
            normalized?: Array<{ from: string; to: string }>;
            redirects?: Array<{ from: string; to: string }>;
            pages?: Record<string, { title: string; extract?: string; pageprops?: Record<string, string> }>;
          };
        }>('https://en.wikipedia.org/w/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
          throttle: this.wikiThrottle,
        });
        const norm = new Map((json.query?.normalized || []).map((n) => [n.from, n.to]));
        const redir = new Map((json.query?.redirects || []).map((n) => [n.from, n.to]));
        const byTitle = new Map(Object.values(json.query?.pages || {}).map((p) => [p.title, p]));
        for (const t of chunk) {
          const n = norm.get(t) || t;
          const page = byTitle.get(redir.get(n) || n);
          const text = page?.extract?.replace(/\s+\n/g, '\n').trim();
          if (page && text && !page.pageprops?.disambiguation) result.set(t, leadSentences(text.replace(/\n+/g, ' '), 1200));
        }
      } catch (err) {
        console.warn(`   ⚠️  Wikipedia extract lookup failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return result;
  }

  // -------------------------------------------------------------------------
  // Importer API
  // -------------------------------------------------------------------------

  async fetchBatch(
    cursor?: string | number,
    limit: number = 50,
    options?: ConnectorOptions
  ): Promise<BatchFetchResult<WikidataEntityRecord>> {
    const topic = this.resolveTopic(options);
    this.useWikipedia = options?.filters?.wikipediaSummaries !== false;
    const offset = this.parseOffset(cursor, topic);
    const pageSize = Math.min(limit, 50);

    const { ids, complete } = await this.getIds(topic, offset + pageSize);
    const pageIds = ids.slice(offset, offset + pageSize);
    if (!pageIds.length) return { records: [], nextCursor: null, hasMore: false };

    const rows = await this.sparql(this.detailsQuery(topic, pageIds));
    const byQid = new Map(rows.map((r) => [qidOf(r.item?.value || ''), r]));

    const files = uniq(rows.map((r) => this.commonsFileName(r.image?.value)).filter((f): f is string => Boolean(f)));
    const licenses = await this.fetchCommonsLicenses(files);

    // Wikipedia lead text (CC BY-SA) only where the Wikidata description is thin.
    const wantExtract = (r: Binding) => this.useWikipedia && r.article?.value && (r.desc?.value || '').trim().length < 40;
    const titles = uniq(
      rows.filter(wantExtract).map((r) => this.articleTitle(r.article!.value)).filter((t): t is string => Boolean(t))
    );
    const extracts = await this.fetchWikipediaExtracts(titles);

    // Keep the QID order of the page; items without an English label are dropped by the query.
    const records: WikidataEntityRecord[] = pageIds
      .filter((q) => byQid.has(q))
      .map((qid) => {
        const binding = byQid.get(qid)!;
        const file = this.commonsFileName(binding.image?.value);
        const title = wantExtract(binding) ? this.articleTitle(binding.article!.value) : undefined;
        return {
          topic,
          qid,
          binding,
          imageLicense: file ? licenses.get(file) : undefined,
          wikipediaExtract: title ? extracts.get(title) : undefined,
        };
      });

    const next = offset + pageIds.length;
    const hasMore = next < ids.length || !complete;
    return { records, nextCursor: hasMore ? `${topic}:${next}` : null, hasMore };
  }

  private buildMedia(record: WikidataEntityRecord, title: string): NonNullable<NormalizedItem['entityData']>['media'] {
    const file = this.commonsFileName(record.binding.image?.value);
    if (!file) return undefined;
    const encoded = encodeURIComponent(file.replace(/ /g, '_'));
    const filePage = `https://commons.wikimedia.org/wiki/File:${encoded}`;
    const lic = record.imageLicense;

    let rights: RightsAssessment;
    if (lic?.licenseShortName) {
      rights = RightsClassifier.classify(lic.licenseShortName, filePage, lic.artist);
      rights.attribution = [lic.artist, lic.licenseShortName, 'via Wikimedia Commons'].filter(Boolean).join(', ');
      if (rights.licenseType === 'unknown' || rights.licenseType === 'copyrighted_metadata_only') {
        rights.canRehost = false;
        rights.isMetadataOnly = true;
      }
    } else {
      rights = {
        licenseType: 'unknown',
        licenseUrl: filePage,
        attribution: 'Wikimedia Commons (see file page)',
        rightsStatement: 'Image licence not verified; see the Wikimedia Commons file page.',
        canRehost: false,
        isMetadataOnly: true,
      };
    }

    return [
      {
        title,
        mediaType: 'image',
        mimeType: guessImageMime(file),
        fileUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=1200`,
        thumbnailUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=400`,
        wikimediaCommonsId: `File:${file}`,
        sourceMediaId: `commons:${file}`,
        rights,
        metadata: {
          commons_file_page: filePage,
          license_short_name: lic?.licenseShortName,
          artist: lic?.artist,
          usage_terms: lic?.usageTerms,
          wikidata_qid: record.qid,
        },
      },
    ];
  }

  async normalize(record: WikidataEntityRecord): Promise<NormalizedItem | null> {
    const b = record.binding;
    const { qid, topic } = record;
    const title = (b.label?.value || '').replace(/\s+/g, ' ').trim();
    if (!title || /^Q\d+$/.test(title)) return null;

    const description = (b.desc?.value || '').trim();
    const articleUrl = b.article?.value;
    const uri = `http://www.wikidata.org/entity/${qid}`;

    // Optional Wikipedia lead (CC BY-SA), prefetched in fetchBatch when the description is thin.
    const extract = record.wikipediaExtract;

    const facts: Array<[string, string | undefined]> = [];
    const tags = new Set<string>(['wikidata']);
    let countryCodes: string[] = [];
    let timePeriod: string | undefined;
    let entityData: NormalizedItem['entityData'] = {};
    let knowledgeType: NormalizedItem['knowledgeType'];
    let fallbackSummary: string;
    const metadata: Record<string, unknown> = {
      wikidata_qid: qid,
      wikidata_topic: topic,
      wikipedia_url: articleUrl,
      sitelinks: b.links?.value ? Number(b.links.value) : undefined,
    };

    const isoList = (s?: string) => uniq(splitList(s).map((c) => c.toUpperCase()).filter((c) => AFRICAN_COUNTRY_CODES.has(c)));

    if (topic === 'states') {
      knowledgeType = 'kingdom_or_state';
      const foundingYear = pickYear(b.inception?.value);
      const dissolutionYear = pickYear(b.dissolution?.value);
      const government = splitList(b.government?.value).slice(0, 2);
      const modernCountries = splitList(b.countries?.value);
      const capitals = splitList(b.capital?.value).slice(0, 3);
      // Country codes: the state's own P17, plus the modern country of its capital(s).
      countryCodes = uniq([...isoList(b.countryIso?.value), ...isoList(b.capitalIso?.value)]);
      timePeriod = formatSpan(foundingYear, dissolutionYear);
      entityData.kingdomOrState = {
        foundingYear,
        dissolutionYear,
        ...(government.length ? { politicalStructure: government.join(', ') } : {}),
        ...(modernCountries.length ? { modernCountries } : {}),
      };
      facts.push(
        ['Founded', foundingYear !== undefined ? formatYear(foundingYear) : undefined],
        ['Dissolved', dissolutionYear !== undefined ? formatYear(dissolutionYear) : undefined],
        ['Capital', capitals.join(', ')],
        ['Form of government', government.join(', ')],
        ['Preceded by', splitList(b.replaces?.value).slice(0, 3).join(', ')],
        ['Succeeded by', splitList(b.replacedBy?.value).slice(0, 3).join(', ')]
      );
      Object.assign(metadata, { capital: capitals, inception: b.inception?.value, dissolution: b.dissolution?.value, capital_coords: b.capitalCoords?.value });
      tags.add('history').add('historical-state');
      const text = `${title} ${description}`.toLowerCase();
      for (const kw of ['kingdom', 'empire', 'sultanate', 'caliphate', 'emirate', 'confederation', 'colony', 'protectorate', 'republic']) {
        if (new RegExp(`\\b${kw}\\b`).test(text)) tags.add(kw);
      }
      fallbackSummary = 'Historical state in Africa recorded in Wikidata.';
    } else if (topic === 'sites') {
      knowledgeType = 'place';
      const coords = b.coords?.value?.match(/Point\(([-\d.eE]+) ([-\d.eE]+)\)/);
      const countries = splitList(b.countries?.value);
      countryCodes = isoList(b.countryIso?.value);
      entityData.place = {
        ...(countries.length ? { modernCountry: countries[0] } : {}),
        ...(coords ? { longitude: Number(coords[1]), latitude: Number(coords[2]) } : {}),
      };
      const types = splitList(b.types?.value).slice(0, 4);
      facts.push(['Type', types.join(', ')], ['Country', countries.join(', ')], ['UNESCO World Heritage Site', b.unesco?.value ? 'Yes' : undefined]);
      metadata.instance_of = types;
      tags.add('heritage-site');
      if (b.archaeological?.value) tags.add('archaeology').add('archaeological-site');
      if (b.unesco?.value) tags.add('unesco-world-heritage');
      fallbackSummary = b.unesco?.value ? 'UNESCO World Heritage Site in Africa recorded in Wikidata.' : 'Archaeological site in Africa recorded in Wikidata.';
    } else {
      knowledgeType = 'person';
      if (topic === 'people') {
        // Skip honorary / later-acquired citizenships: if the birthplace's modern country
        // is known, it must be African.
        const bpIso = splitList(b.birthplaceIso?.value).map((c) => c.toUpperCase());
        if (bpIso.length && !bpIso.some((c) => AFRICAN_COUNTRY_CODES.has(c))) {
          console.log(`⏭️  ${title} (${qid}): born outside Africa; skipped`);
          return null;
        }
      }
      const birth = pickDate(b.birth?.value);
      const death = pickDate(b.death?.value);
      const birthYear = birth.year;
      const deathYear = death.year;
      const approximate = birth.approximate || death.approximate;
      const occupations = splitList(b.occupations?.value).slice(0, 3).map(capitalize);
      const aliases = splitList(b.aliases?.value).filter((a) => a !== title).slice(0, 3);
      const birthplace = splitList(b.birthplace?.value)[0];
      const positions = splitList(b.positions?.value).slice(0, 3);
      countryCodes = isoList(b.citizenshipIso?.value);
      const span = formatSpan(birthYear, deathYear, 'born', 'died');
      timePeriod = span && approximate ? `${span} (approximate)` : span;
      entityData.person = {
        ...(birthYear !== undefined ? { birthYear } : {}),
        ...(deathYear !== undefined ? { deathYear } : {}),
        ...(approximate ? { isApproximateDates: true } : {}),
        ...(occupations.length ? { occupations } : {}),
        ...(aliases.length ? { alternativeNames: aliases } : {}),
      };
      facts.push(
        ['Born', [birthYear !== undefined ? formatYear(birthYear) : undefined, birthplace].filter(Boolean).join(', ')],
        ['Died', deathYear !== undefined ? formatYear(deathYear) : undefined],
        ['Occupation', occupations.join(', ')],
        ['Positions held', positions.join(', ')],
        ['Citizenship', splitList(b.citizenship?.value).slice(0, 3).join(', ')]
      );
      Object.assign(metadata, { birthplace, positions, birth_raw: b.birth?.value, death_raw: b.death?.value });
      if (topic === 'rulers') {
        tags.add('ruler').add('history');
        fallbackSummary = 'Ruler of an African state recorded in Wikidata.';
      } else {
        tags.add('scholar');
        fallbackSummary = 'African scholar or writer recorded in Wikidata.';
      }
      for (const o of occupations) tags.add(kebab(o, 40));
    }

    const factLines = facts
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    let summary = description ? capitalize(description) : '';
    if (!summary && extract) summary = extract.split(/(?<=[.!?])\s+/)[0];
    if (!summary) summary = fallbackSummary;

    const content = [extract, factLines ? `Facts from Wikidata:\n${factLines}` : ''].filter(Boolean).join('\n\n') || undefined;

    const rights: RightsAssessment = extract
      ? {
          licenseType: 'cc_by_sa',
          licenseUrl: CC_BY_SA_URL,
          attribution: 'Wikipedia contributors',
          rightsStatement:
            'Descriptive text from English Wikipedia (CC BY-SA 4.0); structured data from Wikidata (CC0).',
          canRehost: true,
          isMetadataOnly: false,
        }
      : {
          licenseType: 'cc0',
          licenseUrl: CC0_URL,
          attribution: 'Wikidata contributors',
          canRehost: true,
          isMetadataOnly: false,
        };

    const media = this.buildMedia(record, title);
    if (media) entityData = { ...entityData, media };

    return {
      slug: `${kebab(title) || 'item'}-${qid.toLowerCase()}`,
      title,
      summary,
      content,
      knowledgeType,
      sourceSlug: this.sourceSlug,
      sourceRecordId: qid,
      sourceUrl: uri,
      originalUrl: articleUrl || uri,
      externalIds: { wikidata: qid },
      rights,
      languageCode: 'en',
      countryCodes,
      timePeriod,
      metadata,
      tags: Array.from(tags),
      entityData,
    };
  }
}
