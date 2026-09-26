/**
 * AfroArchive Ingestion Framework - Wikimedia Commons Importer
 * Discovers and ingests African cultural heritage assets:
 * historical photographs, maps, manuscripts, artwork, cultural objects,
 * architecture, and archaeological materials with precise rights preservation.
 *
 * NOTE: Does not automatically download or rehost media files.
 * Stores verified metadata, source attribution, and external canonical URLs.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions, KnowledgeType, MediaType } from '../types';
import { RightsClassifier } from '../rights';
import { AfricanRelevanceClassifier } from '../relevance';

export interface WikimediaRawPage {
  pageid: number;
  ns: number;
  title: string;
  imageinfo?: Array<{
    url: string;
    descriptionurl: string;
    thumburl?: string;
    width?: number;
    height?: number;
    size?: number;
    mime?: string;
    extmetadata?: {
      LicenseShortName?: { value: string };
      LicenseUrl?: { value: string };
      License?: { value: string };
      UsageTerms?: { value: string };
      Attribution?: { value: string };
      Credit?: { value: string };
      Artist?: { value: string };
      ImageDescription?: { value: string };
      DateTimeOriginal?: { value: string };
      DateTime?: { value: string };
      ObjectName?: { value: string };
      Categories?: { value: string };
      Restrictions?: { value: string };
    };
  }>;
}

export interface HeritageCategoryConfig {
  query: string;
  knowledgeType: KnowledgeType;
  mediaType: MediaType;
  tags: string[];
}

export const WIKIMEDIA_AFRICAN_CATEGORIES: Record<string, HeritageCategoryConfig> = {
  photographs: {
    query: 'historical photograph Africa OR colonial photography Africa OR archival photo Africa',
    knowledgeType: 'cultural_artifact',
    mediaType: 'image',
    tags: ['historical-photograph', 'archival-photography', 'visual-history', 'african-heritage'],
  },
  maps: {
    query: 'historical map Africa OR map of Africa OR old map Africa',
    knowledgeType: 'cultural_artifact',
    mediaType: 'map',
    tags: ['historical-map', 'cartography', 'historical-geography', 'african-history'],
  },
  manuscripts: {
    query: 'Timbuktu manuscripts OR Timbuktu manuscript OR Ge\'ez manuscript OR Ethiopic manuscript',
    knowledgeType: 'manuscript',
    mediaType: 'image',
    tags: ['manuscript', 'timbuktu', 'islamic-scholarship', 'indigenous-script', 'intellectual-heritage'],
  },
  artwork: {
    query: 'Benin bronze OR Yoruba art OR African sculpture OR Nok art',
    knowledgeType: 'cultural_artifact',
    mediaType: 'image',
    tags: ['african-art', 'sculpture', 'benin-bronze', 'material-culture', 'traditional-craft'],
  },
  cultural_objects: {
    query: 'African mask OR African musical instruments OR Kente cloth OR Ashanti goldweight',
    knowledgeType: 'cultural_artifact',
    mediaType: 'image',
    tags: ['cultural-object', 'traditional-attire', 'musical-instrument', 'folklore', 'indigenous-culture'],
  },
  architecture: {
    query: 'Great Zimbabwe architecture OR Sudano-Sahelian architecture OR Lalibela churches OR Djenne mosque',
    knowledgeType: 'place',
    mediaType: 'image',
    tags: ['african-architecture', 'monuments', 'stone-architecture', 'historic-sites', 'built-heritage'],
  },
  archaeological: {
    query: 'African archaeology OR Nok terracotta OR Olduvai Gorge OR Nubian pyramids OR Meroe pyramids',
    knowledgeType: 'cultural_artifact',
    mediaType: 'image',
    tags: ['archaeology', 'antiquity', 'prehistoric-africa', 'ancient-civilization'],
  },
};

export class WikimediaImporter extends BaseImporter<WikimediaRawPage> {
  readonly name = 'Wikimedia Commons Importer';
  readonly sourceSlug = 'wikimedia-commons';
  readonly sourceName = 'Wikimedia Commons';
  readonly connectorType = 'wikimedia_api';
  readonly baseUrl = 'https://commons.wikimedia.org/w/api.php';

  /**
   * Helper to strip HTML tags from wiki extmetadata text
   */
  private cleanHtml(input?: string): string {
    if (!input) return '';
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Resolves search query and category settings from CLI options
   */
  private resolveCategoryConfig(options?: ConnectorOptions): {
    query: string;
    knowledgeType: KnowledgeType;
    mediaType: MediaType;
    defaultTags: string[];
  } {
    if (options?.query) {
      return {
        query: options.query,
        knowledgeType: 'cultural_artifact',
        mediaType: 'image',
        defaultTags: ['archival-media', 'african-heritage'],
      };
    }

    if (options?.topic) {
      const topicKey = options.topic.toLowerCase().trim().replace(/[-\s]+/g, '_');
      if (WIKIMEDIA_AFRICAN_CATEGORIES[topicKey]) {
        const conf = WIKIMEDIA_AFRICAN_CATEGORIES[topicKey];
        return {
          query: conf.query,
          knowledgeType: conf.knowledgeType,
          mediaType: conf.mediaType,
          defaultTags: conf.tags,
        };
      }
      return {
        query: `${options.topic} Africa`,
        knowledgeType: 'cultural_artifact',
        mediaType: 'image',
        defaultTags: ['archival-media', options.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
      };
    }

    // Default: comprehensive query spanning manuscripts, maps, architecture, and archaeology
    return {
      query:
        'Timbuktu manuscripts OR Great Zimbabwe OR Benin bronze OR historical map Africa OR African mask OR Nok terracotta',
      knowledgeType: 'cultural_artifact',
      mediaType: 'image',
      defaultTags: ['archival-media', 'historical-photography', 'heritage-artifact', 'visual-history'],
    };
  }

  async fetchBatch(
    cursor?: string | number,
    limit: number = 10,
    options?: ConnectorOptions
  ): Promise<BatchFetchResult<WikimediaRawPage>> {
    const sroffset = cursor ? String(cursor) : '0';
    const catConfig = this.resolveCategoryConfig(options);

    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: catConfig.query,
      gsrnamespace: '6', // Namespace 6 = File:
      gsrlimit: String(limit),
      gsroffset: sroffset,
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
      iiurlwidth: '800', // Request 800px web thumbnail directly from Wikimedia
      format: 'json',
      origin: '*',
    });

    const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'AfroArchive-Archival-Bot/1.0 (https://afroarchive.org; contact@afroarchive.org)',
      },
    });

    if (!response.ok) {
      throw new Error(`Wikimedia HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      continue?: { gsroffset?: number };
      query?: { pages?: Record<string, WikimediaRawPage> };
    };

    const pages = data.query?.pages ? Object.values(data.query.pages) : [];
    const nextCursor = data.continue?.gsroffset ? String(data.continue.gsroffset) : null;

    return {
      records: pages,
      nextCursor,
      hasMore: Boolean(nextCursor && pages.length > 0),
    };
  }

  async normalize(page: WikimediaRawPage): Promise<NormalizedItem | null> {
    const info = page.imageinfo?.[0];
    if (!info || !info.url) return null;

    const rawTitle = page.title.replace(/^File:/i, '').replace(/\.[^.]+$/, '');
    const cleanTitle = rawTitle.replace(/[_-]+/g, ' ').trim();
    if (!cleanTitle) return null;

    const metadata = info.extmetadata || {};
    const rawLicense =
      metadata.LicenseShortName?.value ||
      metadata.UsageTerms?.value ||
      metadata.License?.value ||
      'Public Domain';

    const rawArtist = metadata.Artist?.value || metadata.Credit?.value;
    const cleanArtist = this.cleanHtml(rawArtist) || 'Wikimedia Commons Contributor';

    const rawDesc = metadata.ImageDescription?.value || metadata.ObjectName?.value;
    const cleanDesc = this.cleanHtml(rawDesc);
    const summary = cleanDesc || `Historical archival media asset: "${cleanTitle}" preserved on Wikimedia Commons.`;

    // Rights assessment: DO NOT assume all items are freely reusable.
    // Store exact license information where available.
    const rights = RightsClassifier.classify(rawLicense, info.descriptionurl, cleanArtist);

    // If restrictions exist (e.g. personality rights, trademark, cultural sensitivity), enforce safety
    if (metadata.Restrictions?.value) {
      rights.canRehost = false;
      rights.rightsStatement = `Subject to Wikimedia usage restrictions: ${this.cleanHtml(metadata.Restrictions.value)}`;
    }

    // Determine knowledge type and media type
    const titleLower = cleanTitle.toLowerCase();
    let knowledgeType: KnowledgeType = 'cultural_artifact';
    let mediaType: MediaType = 'image';

    if (titleLower.includes('manuscript') || titleLower.includes('timbuktu')) {
      knowledgeType = 'manuscript';
    } else if (titleLower.includes('map') || titleLower.includes('carte') || titleLower.includes('plan')) {
      mediaType = 'map';
    } else if (
      titleLower.includes('church') ||
      titleLower.includes('mosque') ||
      titleLower.includes('zimbabwe') ||
      titleLower.includes('palace')
    ) {
      knowledgeType = 'place';
    }

    const fileId = `WMC-${page.pageid}`;
    const slug = `${cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80)}-${page.pageid}`;

    // Web thumbnail: use Wikimedia generated 800px thumb, fallback to full image
    const thumbnailUrl = info.thumburl || info.url;

    // Build rich tags
    const tags = new Set<string>([
      'archival-media',
      'african-heritage',
      'wikimedia-commons',
      knowledgeType.replace(/_/g, '-'),
    ]);

    if (metadata.Categories?.value) {
      for (const cat of metadata.Categories.value.split('|').slice(0, 5)) {
        const cleanCat = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
        if (cleanCat.length > 2) tags.add(cleanCat);
      }
    }

    // Complete metadata preservation
    const completeMetadata: Record<string, unknown> = {
      pageid: page.pageid,
      file_title: page.title,
      description_url: info.descriptionurl,
      mime_type: info.mime || 'image/jpeg',
      width: info.width,
      height: info.height,
      size_bytes: info.size,
      date_time_original: metadata.DateTimeOriginal?.value,
      date_time_uploaded: metadata.DateTime?.value,
      artist_raw: rawArtist,
      artist_clean: cleanArtist,
      license_short_name: metadata.LicenseShortName?.value,
      license_url: metadata.LicenseUrl?.value,
      usage_terms: metadata.UsageTerms?.value,
      restrictions: metadata.Restrictions?.value,
      categories: metadata.Categories?.value,
      attribution_required: metadata.Attribution?.value,
    };

    return {
      slug,
      title: cleanTitle,
      summary,
      content: cleanDesc || undefined,
      knowledgeType,
      sourceSlug: this.sourceSlug,
      sourceRecordId: fileId,
      sourceUrl: info.descriptionurl,
      originalUrl: info.url,
      externalIds: {
        wikimedia_commons: page.title,
        wikimedia_pageid: String(page.pageid),
      },
      rights,
      languageCode: 'en',
      countryCodes: [],
      timePeriod: metadata.DateTimeOriginal?.value?.slice(0, 4),
      metadata: completeMetadata,
      tags: Array.from(tags),
      entityData: {
        media: [
          {
            title: cleanTitle,
            description: cleanDesc,
            mediaType,
            mimeType: info.mime || 'image/jpeg',
            fileUrl: info.url, // External URL - DO NOT download or rehost binary
            thumbnailUrl, // External thumbnail URL
            sourceMediaId: fileId,
            wikimediaCommonsId: page.title,
            rights,
            width: info.width,
            height: info.height,
            metadata: completeMetadata,
          },
        ],
      },
    };
  }
}
