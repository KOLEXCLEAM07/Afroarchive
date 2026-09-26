/**
 * AfroArchive Ingestion Framework - Wikidata Importer
 * Queries Wikidata's SPARQL endpoint for African historical kingdoms, rulers,
 * archaeological sites, and philosophical concepts.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions } from '../types';
import { RightsClassifier } from '../rights';

export interface WikidataRawBinding {
  item: { value: string };
  itemLabel?: { value: string };
  itemDescription?: { value: string };
  inception?: { value: string };
  dissolution?: { value: string };
  capitalLabel?: { value: string };
  coords?: { value: string };
}

export class WikidataImporter extends BaseImporter<WikidataRawBinding> {
  readonly name = 'Wikidata Importer';
  readonly sourceSlug = 'wikidata';
  readonly sourceName = 'Wikidata Knowledge Base';
  readonly connectorType = 'wikidata_sparql';
  readonly baseUrl = 'https://query.wikidata.org/sparql';

  /**
   * Fetches African historical kingdoms and states via SPARQL
   */
  async fetchBatch(
    cursor?: string | number,
    limit: number = 10,
    options?: ConnectorOptions
  ): Promise<BatchFetchResult<WikidataRawBinding>> {
    const offset = typeof cursor === 'number' ? cursor : parseInt(String(cursor || 0), 10);

    // SPARQL query: Historical states, kingdoms, and empires in Africa
    const sparql = `
      SELECT DISTINCT ?item ?itemLabel ?itemDescription ?inception ?dissolution ?capitalLabel ?coords WHERE {
        ?item wdt:P31/wdt:P279* wd:Q41710 ;       # Instance/subclass of historical state / empire
              wdt:P30 wd:Q15 .                     # Continent: Africa
        OPTIONAL { ?item wdt:P571 ?inception . }
        OPTIONAL { ?item wdt:P576 ?dissolution . }
        OPTIONAL { ?item wdt:P36 ?capital . ?capital rdfs:label ?capitalLabel . FILTER(LANG(?capitalLabel) = "en") }
        OPTIONAL { ?item wdt:P625 ?coords . }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      ORDER BY ?item
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const url = `${this.baseUrl}?query=${encodeURIComponent(sparql)}&format=json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AfroArchive-Ingestion/1.0 (https://afroarchive.org; contact@afroarchive.org) Bot/1.0',
        Accept: 'application/sparql-results+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Wikidata SPARQL HTTP error ${response.status}: ${response.statusText}`);
    }

    const json = (await response.json()) as {
      results: { bindings: WikidataRawBinding[] };
    };

    const records = json.results?.bindings || [];
    const nextCursor = records.length === limit ? offset + limit : null;

    return {
      records,
      nextCursor,
      hasMore: records.length === limit,
    };
  }

  async normalize(binding: WikidataRawBinding): Promise<NormalizedItem | null> {
    const uri = binding.item.value;
    const qid = uri.split('/').pop() || '';
    const title = binding.itemLabel?.value || '';

    // Ignore placeholder QIDs or missing titles
    if (!title || title.startsWith('Q') && /^\d+$/.test(title.slice(1))) {
      return null;
    }

    const summary = binding.itemDescription?.value || `Historical African civilization and state indexed in Wikidata (${qid}).`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${qid.toLowerCase()}`;

    // Parse inception year
    let foundingYear: number | undefined;
    if (binding.inception?.value) {
      const match = binding.inception.value.match(/^(-?\d{1,4})/);
      if (match) foundingYear = parseInt(match[1], 10);
    }

    // Parse dissolution year
    let dissolutionYear: number | undefined;
    if (binding.dissolution?.value) {
      const match = binding.dissolution.value.match(/^(-?\d{1,4})/);
      if (match) dissolutionYear = parseInt(match[1], 10);
    }

    return {
      slug,
      title,
      summary,
      knowledgeType: 'kingdom_or_state',
      sourceSlug: this.sourceSlug,
      sourceRecordId: qid,
      sourceUrl: uri,
      originalUrl: uri,
      externalIds: {
        wikidata: qid,
      },
      rights: RightsClassifier.classify('CC0', uri, 'Wikidata Contributors'),
      languageCode: 'en',
      countryCodes: [],
      timePeriod: foundingYear ? `${foundingYear < 0 ? Math.abs(foundingYear) + ' BCE' : foundingYear + ' CE'}` : undefined,
      metadata: {
        wikidata_qid: qid,
        capital: binding.capitalLabel?.value,
        inception: binding.inception?.value,
        dissolution: binding.dissolution?.value,
      },
      tags: ['history', 'african-kingdom', 'civilization', 'precolonial'],
      entityData: {
        kingdomOrState: {
          foundingYear,
          dissolutionYear,
          politicalStructure: 'Monarchy / Empire',
          notableRulers: [],
          modernCountries: [],
        },
      },
    };
  }
}
