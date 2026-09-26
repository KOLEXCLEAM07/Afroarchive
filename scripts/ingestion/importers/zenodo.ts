/**
 * AfroArchive Ingestion Framework - Zenodo Importer
 * Ingests open scientific research outputs, theses, and African manuscripts hosted on Zenodo.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions } from '../types';
import { RightsClassifier } from '../rights';

export interface ZenodoRawRecord {
  id: number;
  doi?: string;
  metadata: {
    title: string;
    description?: string;
    publication_date?: string;
    creators?: Array<{ name: string; affiliation?: string; orcid?: string }>;
    license?: { id: string };
    keywords?: string[];
    resource_type?: { title: string; type: string };
  };
  links?: {
    html: string;
    doi?: string;
  };
}

export class ZenodoImporter extends BaseImporter<ZenodoRawRecord> {
  readonly name = 'Zenodo Importer';
  readonly sourceSlug = 'zenodo';
  readonly sourceName = 'Zenodo Open Science Repository';
  readonly connectorType = 'rest_api';
  readonly baseUrl = 'https://zenodo.org/api';

  async fetchBatch(
    cursor?: string | number,
    limit: number = 10,
    options?: ConnectorOptions
  ): Promise<BatchFetchResult<ZenodoRawRecord>> {
    const page = typeof cursor === 'number' ? cursor : parseInt(String(cursor || 1), 10);
    const query = options?.filters?.query ? String(options.filters.query) : 'African history OR African languages';

    const url = `${this.baseUrl}/records?q=${encodeURIComponent(query)}&size=${limit}&page=${page}&sort=mostrecent`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AfroArchive-Research-Bot/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Zenodo HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      hits?: {
        hits: ZenodoRawRecord[];
        total: number;
      };
    };

    const records = data.hits?.hits || [];
    const hasMore = records.length === limit;
    const nextCursor = hasMore ? page + 1 : null;

    return {
      records,
      nextCursor,
      hasMore,
    };
  }

  async normalize(record: ZenodoRawRecord): Promise<NormalizedItem | null> {
    const title = record.metadata?.title;
    if (!title) return null;

    const zenodoId = String(record.id);
    const summary = record.metadata.description?.replace(/<[^>]*>/g, '').slice(0, 400) || `Scientific record ${zenodoId} from Zenodo.`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)}-zenodo-${zenodoId}`;

    const rawLicense = record.metadata.license?.id || 'cc-by';
    const firstAuthor = record.metadata.creators?.[0]?.name;

    return {
      slug,
      title,
      summary,
      knowledgeType: 'work',
      sourceSlug: this.sourceSlug,
      sourceRecordId: zenodoId,
      sourceUrl: record.links?.html || `https://zenodo.org/records/${zenodoId}`,
      originalUrl: record.doi ? `https://doi.org/${record.doi}` : undefined,
      externalIds: {
        zenodo: zenodoId,
        doi: record.doi,
      },
      rights: RightsClassifier.classify(rawLicense, record.links?.html, firstAuthor),
      languageCode: 'en',
      countryCodes: [],
      datePublished: record.metadata.publication_date,
      metadata: {
        zenodo_id: zenodoId,
        resource_type: record.metadata.resource_type?.title,
        keywords: record.metadata.keywords,
      },
      tags: ['open-science', 'scholarly-record', 'zenodo', ...(record.metadata.keywords || []).slice(0, 5)],
    };
  }
}
