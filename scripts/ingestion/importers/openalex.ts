/**
 * AfroArchive Ingestion Framework - OpenAlex Importer
 * Queries OpenAlex REST API for African scholarly research, open-access papers,
 * academic monographs, indigenous knowledge systems, and African institutions.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions } from '../types';
import { RightsClassifier } from '../rights';
import { AfricanRelevanceClassifier } from '../relevance';

export interface OpenAlexRawWork {
  id: string;
  doi?: string;
  title: string;
  display_name?: string;
  publication_year?: number;
  type?: string;
  abstract_inverted_index?: Record<string, number[]>;
  open_access?: {
    is_oa: boolean;
    oa_status: string;
    oa_url?: string | null;
    any_repository_has_fulltext?: boolean;
  };
  primary_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    license?: string | null;
    source?: {
      id?: string;
      display_name?: string;
      host_organization_name?: string;
      type?: string;
    };
  };
  authorships?: Array<{
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    author_position?: string;
    institutions?: Array<{
      id: string;
      display_name: string;
      ror?: string;
      country_code?: string;
      type?: string;
      city?: string;
    }>;
  }>;
  cited_by_count?: number;
  keywords?: Array<{ keyword: string; score: number }>;
  concepts?: Array<{ id: string; display_name: string; score: number }>;
  created_date?: string;
  updated_date?: string;
}

export const AFRICAN_SCHOLARLY_TOPIC_QUERIES: Record<string, string> = {
  philosophy: '"African philosophy" OR "African epistemologies" OR "Ubuntu philosophy" OR "Akan philosophy"',
  history: '"African history" OR "precolonial Africa" OR "African kingdoms" OR "Sahel empires"',
  languages: '"African languages" OR "Bantu languages" OR "Niger-Congo" OR "Afroasiatic languages"',
  culture: '"African culture" OR "African traditions" OR "African folklore" OR "African heritage"',
  archaeology: '"African archaeology" OR "archaeology of Africa" OR "Olduvai" OR "Great Zimbabwe"',
  anthropology: '"African anthropology" OR "anthropology of Africa" OR "African ethnography"',
  literature: '"African literature" OR "African writers" OR "postcolonial African literature"',
  science: '"African science" OR "science in Africa" OR "African ethnomathematics"',
  technology: '"African technology" OR "indigenous African technology"',
  'indigenous-knowledge': '"African indigenous knowledge" OR "indigenous knowledge systems Africa" OR "traditional African medicine"',
  institutions: '"African universities" OR "higher education in Africa" OR "African academic institutions"',
  scholars: '"African scholars" OR "African intellectuals" OR "Pan-African thinkers"',
};

// Major African country codes for institution identification
const AFRICAN_COUNTRY_CODES = new Set([
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD',
  'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE',
  'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG',
  'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG',
  'ZM', 'ZW'
]);

export class OpenAlexImporter extends BaseImporter<OpenAlexRawWork> {
  readonly name = 'OpenAlex Importer';
  readonly sourceSlug = 'openalex';
  readonly sourceName = 'OpenAlex Scholarly Index';
  readonly connectorType = 'openalex_api';
  readonly baseUrl = 'https://api.openalex.org';

  /**
   * Reconstructs text from OpenAlex inverted index
   */
  private reconstructAbstract(invertedIndex?: Record<string, number[]>): string {
    if (!invertedIndex || Object.keys(invertedIndex).length === 0) return '';
    const words: Array<{ word: string; pos: number }> = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        words.push({ word, pos });
      }
    }
    words.sort((a, b) => a.pos - b.pos);
    return words.map((w) => w.word).join(' ');
  }

  /**
   * Determines the search query based on options or defaults
   */
  private resolveTopicQuery(options?: ConnectorOptions): string {
    if (options?.query) {
      return options.query;
    }
    if (options?.topic) {
      const normalizedTopic = options.topic.toLowerCase().trim();
      if (AFRICAN_SCHOLARLY_TOPIC_QUERIES[normalizedTopic]) {
        return AFRICAN_SCHOLARLY_TOPIC_QUERIES[normalizedTopic];
      }
      return `"${options.topic}" Africa`;
    }

    // Default: comprehensive query spanning African philosophy, history, and indigenous knowledge
    return '"African philosophy" OR "African history" OR "African archaeology" OR "African indigenous knowledge" OR "African literature"';
  }

  async fetchBatch(
    cursor?: string | number,
    limit: number = 10,
    options?: ConnectorOptions
  ): Promise<BatchFetchResult<OpenAlexRawWork>> {
    const topicQuery = this.resolveTopicQuery(options);

    // Pagination: OpenAlex supports cursor pagination with cursor=* or next_cursor
    let cursorParam = '*';
    if (cursor && typeof cursor === 'string' && cursor !== 'start') {
      cursorParam = cursor;
    }

    const url = new URL(`${this.baseUrl}/works`);
    url.searchParams.set('search', topicQuery);
    url.searchParams.set('per-page', String(limit));
    url.searchParams.set('cursor', cursorParam);

    // Incremental synchronization support:
    // If incremental mode is requested, filter by recent publication year
    if (options?.incremental) {
      const currentYear = new Date().getFullYear();
      url.searchParams.set('filter', `publication_year:>${currentYear - 2}`);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AfroArchive-Research-Engine/1.0 (mailto:scholarship@afroarchive.org)',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAlex HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      results: OpenAlexRawWork[];
      meta: { count: number; per_page: number; next_cursor?: string | null };
    };

    const records = data.results || [];
    const nextCursor = data.meta?.next_cursor || null;
    const hasMore = Boolean(nextCursor && records.length > 0);

    return {
      records,
      nextCursor,
      hasMore,
    };
  }

  async normalize(work: OpenAlexRawWork): Promise<NormalizedItem | null> {
    const title = work.display_name || work.title;
    if (!title) return null;

    const openAlexId = work.id.split('/').pop() || work.id;
    const abstractText = this.reconstructAbstract(work.abstract_inverted_index);

    // Extract country codes and structured authorships
    const authorCountryCodes = new Set<string>();
    const authors = (work.authorships || []).map((a) => {
      const primaryInst = a.institutions?.[0];
      const instCountry = primaryInst?.country_code?.toUpperCase();
      if (instCountry) {
        authorCountryCodes.add(instCountry);
      }

      const instOpenAlexId = primaryInst?.id ? primaryInst.id.split('/').pop() : undefined;
      const instRor = primaryInst?.ror ? primaryInst.ror.split('/').pop() : undefined;
      const authorOpenAlexId = a.author?.id ? a.author.id.split('/').pop() : undefined;

      return {
        name: a.author?.display_name || 'Unknown Author',
        openalexId: authorOpenAlexId,
        orcid: a.author?.orcid,
        affiliation: primaryInst?.display_name,
        institution: primaryInst
          ? {
              name: primaryInst.display_name,
              openalexId: instOpenAlexId,
              ror: instRor,
              countryCode: instCountry,
              city: primaryInst.city,
            }
          : undefined,
      };
    });

    const countries = Array.from(authorCountryCodes);
    const conceptTags = (work.concepts || []).map((c) => c.display_name);

    // African relevance evaluation: verify content relates to African scholarship
    const relevanceAssessment = AfricanRelevanceClassifier.assess(
      title,
      abstractText || title,
      countries,
      conceptTags
    );

    const hasAfricanInstitution = countries.some((c) => AFRICAN_COUNTRY_CODES.has(c));

    if (!relevanceAssessment.isRelevant && !hasAfricanInstitution) {
      return null;
    }

    // Determine Open Access & legitimate full-text URL
    const isOA = Boolean(work.open_access?.is_oa);
    const oaStatus = work.open_access?.oa_status || (isOA ? 'gold' : 'closed');

    // COPYRIGHT PROTECTION: Only link legitimate full-text PDF if verified Open Access
    const legitimatePdfUrl = isOA
      ? work.primary_location?.pdf_url || work.open_access?.oa_url || undefined
      : undefined;

    // License resolution
    const rawLicense = work.primary_location?.license || (isOA ? 'CC-BY' : 'Copyright');
    const firstAuthor = authors[0]?.name;
    const rights = RightsClassifier.classify(rawLicense, work.doi, firstAuthor);

    // If paper is closed/copyrighted, enforce canRehost = false and metadata-only status
    if (!isOA) {
      rights.canRehost = false;
      rights.isMetadataOnly = true;
    }

    const journalName = work.primary_location?.source?.display_name;
    const publisherName = work.primary_location?.source?.host_organization_name;

    const summary = abstractText
      ? abstractText.slice(0, 480) + (abstractText.length > 480 ? '...' : '')
      : `Scholarly work published in ${work.publication_year || 'academic literature'}${journalName ? ` in ${journalName}` : ''}.`;

    const slug = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80)}-${openAlexId.toLowerCase()}`;

    // Tags
    const tags = new Set<string>([
      'scholarly-work',
      'academic-research',
      'african-scholarship',
    ]);
    if (isOA) tags.add('open-access');
    if (work.type) tags.add(work.type.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

    // Add relevant concept tags
    for (const concept of work.concepts?.slice(0, 4) || []) {
      const tagSlug = concept.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (tagSlug.length > 2) tags.add(tagSlug);
    }

    return {
      slug,
      title,
      summary,
      content: abstractText || undefined,
      knowledgeType: 'work',
      sourceSlug: this.sourceSlug,
      sourceRecordId: openAlexId,
      sourceUrl: work.id,
      originalUrl: work.doi || work.primary_location?.landing_page_url || work.id,
      externalIds: {
        openalex: openAlexId,
        doi: work.doi,
      },
      rights,
      languageCode: 'en',
      countryCodes: Array.from(authorCountryCodes),
      datePublished: work.publication_year ? `${work.publication_year}-01-01` : undefined,
      metadata: {
        openalex_id: openAlexId,
        doi: work.doi,
        citation_count: work.cited_by_count || 0,
        is_oa: isOA,
        oa_status: oaStatus,
        journal: journalName,
        publisher: publisherName,
        relevance_score: relevanceAssessment.score,
        relevance_reasons: relevanceAssessment.reasons,
      },
      tags: Array.from(tags),
      entityData: {
        work: {
          doi: work.doi,
          openalexId: openAlexId,
          workType: work.type || 'journal_article',
          publicationYear: work.publication_year,
          venueName: journalName,
          publisher: publisherName,
          citationCount: work.cited_by_count || 0,
          isOpenAccess: isOA,
          oaStatus,
          pdfUrl: legitimatePdfUrl,
          landingPageUrl: work.primary_location?.landing_page_url || work.doi || work.id,
          authors,
        },
      },
    };
  }
}
