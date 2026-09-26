/**
 * AfroArchive Ingestion Framework - openAFRICA Importer
 * Queries the openAFRICA CKAN portal for public datasets and open governance data.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions } from '../types';
import { RightsClassifier } from '../rights';

export interface OpenAfricaRawDataset {
  id: string;
  name: string;
  title: string;
  notes?: string;
  license_id?: string;
  license_title?: string;
  organization?: { title: string };
  metadata_created?: string;
  url?: string;
  tags?: Array<{ name: string }>;
}

export class OpenAfricaImporter extends BaseImporter<OpenAfricaRawDataset> {
  readonly name = 'openAFRICA Importer';
  readonly sourceSlug = 'openafrica';
  readonly sourceName = 'openAFRICA Open Data Portal';
  readonly connectorType = 'rest_api';
  readonly baseUrl = 'https://open.africa/api/3/action';

  async fetchBatch(
    cursor?: string | number,
    limit: number = 10,
    options?: ConnectorOptions
  ): Promise<BatchFetchResult<OpenAfricaRawDataset>> {
    const start = typeof cursor === 'number' ? cursor : parseInt(String(cursor || 0), 10);
    const url = `${this.baseUrl}/package_search?rows=${limit}&start=${start}&q=heritage OR culture OR history OR language`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AfroArchive-Data-Agent/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`openAFRICA HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      result?: {
        results: OpenAfricaRawDataset[];
        count: number;
      };
    };

    const records = data.result?.results || [];
    const hasMore = records.length === limit;
    const nextCursor = hasMore ? start + limit : null;

    return {
      records,
      nextCursor,
      hasMore,
    };
  }

  async normalize(dataset: OpenAfricaRawDataset): Promise<NormalizedItem | null> {
    const title = dataset.title || dataset.name;
    if (!title) return null;

    const summary = dataset.notes?.slice(0, 400) || `Open dataset from openAFRICA: ${title}.`;
    const slug = `${dataset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${dataset.id.slice(0, 8)}`;

    const tags = (dataset.tags || []).map((t) => t.name);

    return {
      slug,
      title,
      summary,
      knowledgeType: 'work',
      sourceSlug: this.sourceSlug,
      sourceRecordId: dataset.id,
      sourceUrl: `https://open.africa/dataset/${dataset.name}`,
      originalUrl: dataset.url,
      externalIds: {
        openafrica_id: dataset.id,
      },
      rights: RightsClassifier.classify(dataset.license_id || dataset.license_title || 'CC-BY', `https://open.africa/dataset/${dataset.name}`, dataset.organization?.title),
      languageCode: 'en',
      countryCodes: [],
      datePublished: dataset.metadata_created,
      metadata: {
        organization: dataset.organization?.title,
        license: dataset.license_title,
      },
      tags: ['open-data', 'openafrica', 'public-dataset', ...tags.slice(0, 5)],
    };
  }
}
