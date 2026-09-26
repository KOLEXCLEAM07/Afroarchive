/**
 * AfroArchive Ingestion Framework - Masakhane Importer
 * Ingests indigenous African language datasets, linguistic benchmarks, and translation corpora.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions } from '../types';
import { RightsClassifier } from '../rights';

export interface MasakhaneRawRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  topics?: string[];
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  };
}

export class MasakhaneImporter extends BaseImporter<MasakhaneRawRepo> {
  readonly name = 'Masakhane Importer';
  readonly sourceSlug = 'masakhane';
  readonly sourceName = 'Masakhane Natural Language Processing';
  readonly connectorType = 'rest_api';
  readonly baseUrl = 'https://api.github.com/orgs/masakhane-io/repos';

  async fetchBatch(
    cursor?: string | number,
    limit: number = 10,
    options?: ConnectorOptions
  ): Promise<BatchFetchResult<MasakhaneRawRepo>> {
    const page = typeof cursor === 'number' ? cursor : parseInt(String(cursor || 1), 10);
    const url = `${this.baseUrl}?per_page=${limit}&page=${page}&sort=updated`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AfroArchive-NLP-Agent/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Masakhane GitHub API error ${response.status}: ${response.statusText}`);
    }

    const repos = (await response.json()) as MasakhaneRawRepo[];
    const hasMore = repos.length === limit;
    const nextCursor = hasMore ? page + 1 : null;

    return {
      records: repos,
      nextCursor,
      hasMore,
    };
  }

  async normalize(repo: MasakhaneRawRepo): Promise<NormalizedItem | null> {
    const title = repo.name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const summary = repo.description || `African language NLP and machine translation corpus: ${repo.full_name}.`;
    const slug = `masakhane-${repo.name.toLowerCase()}`;

    const rawLicense = repo.license?.spdx_id || repo.license?.name || 'Apache-2.0';

    return {
      slug,
      title: `Masakhane: ${title}`,
      summary,
      knowledgeType: 'work',
      sourceSlug: this.sourceSlug,
      sourceRecordId: String(repo.id),
      sourceUrl: repo.html_url,
      originalUrl: repo.html_url,
      externalIds: {
        github_repo: repo.full_name,
      },
      rights: RightsClassifier.classify(rawLicense, repo.html_url, 'Masakhane NLP Community'),
      languageCode: 'en',
      countryCodes: [],
      datePublished: repo.created_at,
      metadata: {
        topics: repo.topics,
        license: repo.license?.name,
      },
      tags: ['nlp', 'african-languages', 'machine-translation', 'linguistics', ...(repo.topics || []).slice(0, 4)],
    };
  }
}
