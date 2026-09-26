/**
 * AfroArchive Ingestion Framework - Type Definitions
 * Defines standard interfaces for provenance, normalization, rights, connectors, and resumable imports.
 */

export type KnowledgeType =
  | 'person'
  | 'place'
  | 'event'
  | 'work'
  | 'philosophical_concept'
  | 'culture'
  | 'kingdom_or_state'
  | 'language'
  | 'cultural_artifact'
  | 'manuscript'
  | 'article';

export type LicenseType =
  | 'public_domain'
  | 'cc0'
  | 'cc_by'
  | 'cc_by_sa'
  | 'cc_by_nc'
  | 'cc_by_nc_sa'
  | 'cc_by_nd'
  | 'copyrighted_metadata_only'
  | 'unknown';

export type VerificationStatus = 'raw' | 'normalized' | 'verified' | 'flagged';
export type MediaType = 'image' | 'document' | 'audio' | 'video' | 'map' | '3d_model';
export type IngestionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';
export type IngestionStage = 'fetch' | 'normalize' | 'classify' | 'deduplicate' | 'rights_check' | 'write';

export interface ExternalIds {
  wikidata?: string;
  doi?: string;
  openalex?: string;
  wikimedia_commons?: string;
  geonames?: string;
  zenodo?: string;
  ror?: string;
  orcid?: string;
  [key: string]: string | undefined;
}

export interface RightsAssessment {
  licenseType: LicenseType;
  licenseUrl?: string;
  attribution: string;
  rightsStatement?: string;
  canRehost: boolean;
  isMetadataOnly: boolean;
}

export interface RelevanceAssessment {
  isRelevant: boolean;
  score: number; // 0.0 to 1.0
  reasons: string[];
  matchedKeywords: string[];
  detectedCountries: string[];
}

export interface SourceConfig {
  endpoint?: string;
  rateLimitMs?: number;
  batchSize?: number;
  maxRetries?: number;
  lastCursor?: string | number | null;
  lastSyncedAt?: string | null;
  filters?: Record<string, unknown>;
  incremental?: boolean;
}

export interface NormalizedItem {
  slug: string;
  title: string;
  originalTitle?: string;
  summary: string;
  content?: string;
  knowledgeType: KnowledgeType;
  sourceSlug: string;
  sourceRecordId: string;
  sourceUrl: string;
  originalUrl?: string;
  externalIds: ExternalIds;
  rights: RightsAssessment;
  languageCode: string;
  countryCodes: string[];
  timePeriod?: string;
  datePublished?: string;
  metadata: Record<string, unknown>;
  tags: string[];

  // Entity-specific data
  entityData?: {
    person?: {
      alternativeNames?: string[];
      birthYear?: number;
      deathYear?: number;
      isApproximateDates?: boolean;
      era?: string;
      occupations?: string[];
    };
    place?: {
      historicalNames?: string[];
      modernCountry?: string;
      historicalRegion?: string;
      latitude?: number;
      longitude?: number;
    };
    work?: {
      doi?: string;
      openalexId?: string;
      workType?: string;
      publicationYear?: number;
      venueName?: string;
      publisher?: string;
      citationCount?: number;
      isOpenAccess?: boolean;
      oaStatus?: string;
      pdfUrl?: string;
      landingPageUrl?: string;
      authors?: Array<{
        name: string;
        openalexId?: string;
        orcid?: string;
        affiliation?: string;
        institution?: {
          name: string;
          openalexId?: string;
          ror?: string;
          countryCode?: string;
          city?: string;
        };
      }>;
    };
    kingdomOrState?: {
      foundingYear?: number;
      dissolutionYear?: number;
      politicalStructure?: string;
      notableRulers?: string[];
      modernCountries?: string[];
    };
    philosophicalConcept?: {
      originalTerm?: string;
      tradition?: string;
      definition: string;
      culturalContext?: string;
      ethicalFramework?: string;
    };
    media?: Array<{
      title: string;
      description?: string;
      mediaType: MediaType;
      mimeType: string;
      fileUrl: string;
      thumbnailUrl?: string;
      wikimediaCommonsId?: string;
      sourceMediaId?: string;
      rights: RightsAssessment;
      width?: number;
      height?: number;
      metadata?: Record<string, unknown>;
    }>;
  };
}

export interface ConnectorOptions {
  batchSize?: number;
  maxRecords?: number;
  dryRun?: boolean;
  cursor?: string | number;
  filters?: Record<string, unknown>;
  resume?: boolean;
  incremental?: boolean;
  topic?: string;
  query?: string;
}

export interface BatchFetchResult<TRawRecord = unknown> {
  records: TRawRecord[];
  nextCursor?: string | number | null;
  hasMore: boolean;
}

export interface IngestionRunSummary {
  runId: string;
  sourceSlug: string;
  discovered: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  durationMs: number;
  lastCheckpoint?: string | number | null;
}

export interface Importer<TRawRecord = unknown> {
  readonly name: string;
  readonly sourceSlug: string;
  readonly sourceName: string;
  fetchBatch(cursor?: string | number, limit?: number, options?: ConnectorOptions): Promise<BatchFetchResult<TRawRecord>>;
  normalize(rawRecord: TRawRecord): Promise<NormalizedItem | null>;
  run(options?: ConnectorOptions): Promise<IngestionRunSummary>;
}
