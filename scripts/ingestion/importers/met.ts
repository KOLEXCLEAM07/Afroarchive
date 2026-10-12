/**
 * AfroArchive Ingestion Framework - The Metropolitan Museum of Art Importer
 *
 * Enumerates objects with the paginated search API (v1.1) and fetches each object
 * record. Only public-domain objects (isPublicDomain === true) with a primary image
 * are imported; the Met releases these images and data under CC0.
 *
 * Topics (--topic=...):
 *   africa    (default) Arts of Africa, Oceania & the Americas, geoLocation=Africa
 *   egyptian  Department of Egyptian Art
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions, KnowledgeType, RightsAssessment } from '../types';
import { fetchJson, Throttle, HttpError, cleanText, kebab, labelledLines, guessImageMime } from '../http';
import { africanCountryCode, detectAfricanCountryCodes } from '../countries';

export interface MetObject {
  objectID: number;
  isPublicDomain?: boolean;
  primaryImage?: string;
  primaryImageSmall?: string;
  additionalImages?: string[];
  accessionNumber?: string;
  department?: string;
  objectName?: string;
  title?: string;
  culture?: string;
  period?: string;
  dynasty?: string;
  reign?: string;
  artistDisplayName?: string;
  artistDisplayBio?: string;
  objectDate?: string;
  objectBeginDate?: number;
  objectEndDate?: number;
  medium?: string;
  dimensions?: string;
  creditLine?: string;
  geographyType?: string;
  city?: string;
  state?: string;
  country?: string;
  region?: string;
  subregion?: string;
  locale?: string;
  excavation?: string;
  classification?: string;
  objectURL?: string;
  objectWikidata_URL?: string;
  tags?: Array<{ term: string }> | null;
  /** Set when the object request failed (e.g. 404); normalize() skips it. */
  _fetchError?: string;
}

const MET_TOPICS: Record<string, { departmentId: number; geoLocation?: string; label: string }> = {
  africa: { departmentId: 5, geoLocation: 'Africa', label: 'Arts of Africa' },
  egyptian: { departmentId: 10, label: 'Egyptian Art' },
};

const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';

export class MetMuseumImporter extends BaseImporter<MetObject> {
  readonly name = 'Met Museum Importer';
  readonly sourceSlug = 'met-museum';
  readonly sourceName = 'The Metropolitan Museum of Art';
  readonly connectorType = 'met_collection_api';
  readonly baseUrl = 'https://collectionapi.metmuseum.org/public/collection';

  protected batchSize = 50;
  // Stay far below the Met's published limit (~4 req/s); bursts trigger 403s from its CDN.
  private readonly throttle = new Throttle(250);
  private topicKey = 'africa';
  private loggedTotal = false;

  private resolveTopic(options?: ConnectorOptions): string {
    const key = (options?.topic || 'africa').toLowerCase().trim();
    if (!MET_TOPICS[key]) throw new Error(`Unknown Met topic "${options?.topic}". Use one of: ${Object.keys(MET_TOPICS).join(', ')}`);
    return key;
  }

  protected isTrustedAfricanSource(item: NormalizedItem): boolean {
    // Egyptian Art is African by definition. For the Africa/Oceania/Americas wing we
    // rely on the Met's geoLocation=Africa filter but still require an African signal
    // in the geography fields, so mis-tagged Oceanic/American objects go through the
    // keyword classifier instead.
    if (this.topicKey === 'egyptian') return true;
    return item.countryCodes.length > 0 || item.metadata.geography_mentions_africa === true;
  }

  async fetchBatch(
    cursor?: string | number,
    limit: number = 50,
    options?: ConnectorOptions
  ): Promise<BatchFetchResult<MetObject>> {
    this.topicKey = this.resolveTopic(options);
    const topic = MET_TOPICS[this.topicKey];
    const offset = typeof cursor === 'number' ? cursor : parseInt(String(cursor ?? 0), 10) || 0;
    const pageSize = Math.min(limit, 100);

    // openAccess=true restricts the search to public-domain (CC0) objects server-side.
    const params = new URLSearchParams({
      departmentId: String(topic.departmentId),
      hasImages: 'true',
      openAccess: 'true',
      q: '*',
      limit: String(pageSize),
      offset: String(offset),
    });
    if (topic.geoLocation) params.set('geoLocation', topic.geoLocation);

    const search = await fetchJson<{ total: number; objectIDs: number[] | null }>(
      `${this.baseUrl}/v1.1/search?${params.toString()}`,
      { throttle: this.throttle, retryOn: [403] }
    );
    const ids = search.objectIDs || [];
    if (!this.loggedTotal) {
      console.log(`   Met search (${topic.label}): ${search.total} open-access objects with images.`);
      this.loggedTotal = true;
    }
    if (!ids.length) return { records: [], nextCursor: null, hasMore: false };

    const records: MetObject[] = [];
    for (const id of ids) {
      try {
        // The Met's CDN occasionally answers 403 to bursts; those are retried with backoff.
        records.push(await fetchJson<MetObject>(`${this.baseUrl}/v1/objects/${id}`, { throttle: this.throttle, retryOn: [403], retries: 5 }));
      } catch (err) {
        const msg = err instanceof HttpError ? `HTTP ${err.status}` : err instanceof Error ? err.message : String(err);
        records.push({ objectID: id, _fetchError: msg });
      }
    }

    const next = offset + ids.length;
    const hasMore = next < search.total;
    return { records, nextCursor: hasMore ? next : null, hasMore };
  }

  private knowledgeTypeFor(obj: MetObject): KnowledgeType {
    // Only the object's own type (start of objectName, or the classification) counts —
    // e.g. "Amulet, papyrus scepter" must stay an artifact.
    const name = (obj.objectName || '').toLowerCase().trim();
    const classification = (obj.classification || '').toLowerCase();
    const isManuscript =
      /^(manuscripts?|codex|codices|books?|folios?|scrolls?|papyrus|papyri|prayer book|healing scroll)\b/.test(name) ||
      /\b(manuscripts?|codices|papyri|books)\b/.test(classification);
    return isManuscript ? 'manuscript' : 'cultural_artifact';
  }

  async normalize(obj: MetObject): Promise<NormalizedItem | null> {
    if (obj._fetchError) {
      console.log(`⏭️  Met object ${obj.objectID} unavailable (${obj._fetchError})`);
      return null;
    }
    if (obj.isPublicDomain !== true || !obj.primaryImage) return null;

    const title = cleanText(obj.title) || cleanText(obj.objectName);
    if (!title) return null;

    const id = String(obj.objectID);
    const culture = cleanText(obj.culture);
    const country = cleanText(obj.country);
    const medium = cleanText(obj.medium);
    const objectName = cleanText(obj.objectName);
    const creditLine = cleanText(obj.creditLine);
    const geography = [obj.locale, obj.city, obj.state, obj.subregion, obj.region, obj.country].map(cleanText).filter(Boolean);

    const countryCodes = Array.from(
      new Set([africanCountryCode(country), ...detectAfricanCountryCodes(obj.region, obj.state)].filter((c): c is string => Boolean(c)))
    );

    // Short factual sentence composed only from catalogue fields.
    const lead = [objectName || title, culture, country].filter(Boolean).join(', ');
    const summary = `${lead}.${medium ? ` ${medium}.` : ''}`;

    const content = labelledLines([
      ['Object name', objectName],
      ['Date', obj.objectDate],
      ['Culture', culture],
      ['Period', obj.period],
      ['Dynasty', obj.dynasty],
      ['Reign', obj.reign],
      ['Artist', obj.artistDisplayName],
      ['Geography', geography.join(', ')],
      ['Medium', medium],
      ['Dimensions', obj.dimensions],
      ['Classification', obj.classification],
      ['Credit line', creditLine],
      ['Accession number', obj.accessionNumber],
    ]);

    const rights: RightsAssessment = {
      licenseType: 'cc0',
      licenseUrl: CC0_URL,
      attribution: `The Metropolitan Museum of Art${creditLine ? `, ${creditLine}` : ''}`,
      rightsStatement: 'Open Access: public-domain object, image and data released under CC0 by The Met.',
      canRehost: true,
      isMetadataOnly: false,
    };

    const tags = new Set<string>(['museum-object', 'met-museum', 'african-art']);
    if (this.topicKey === 'egyptian') tags.add('ancient-egypt');
    if (obj.classification) tags.add(kebab(obj.classification, 40));
    for (const t of obj.tags || []) {
      const slug = kebab(t.term, 40);
      if (slug.length > 2) tags.add(slug);
    }

    return {
      slug: `${kebab(title) || 'object'}-met-${id}`,
      title,
      summary,
      content,
      knowledgeType: this.knowledgeTypeFor(obj),
      sourceSlug: this.sourceSlug,
      sourceRecordId: id,
      sourceUrl: obj.objectURL || `https://www.metmuseum.org/art/collection/search/${id}`,
      originalUrl: obj.objectURL || undefined,
      externalIds: {
        met: id,
        ...(obj.objectWikidata_URL ? { wikidata: obj.objectWikidata_URL.split('/').pop() } : {}),
      },
      rights,
      languageCode: 'en',
      countryCodes,
      timePeriod: cleanText(obj.objectDate) || undefined,
      metadata: {
        met_object_id: obj.objectID,
        accession_number: obj.accessionNumber,
        department: obj.department,
        object_name: objectName || undefined,
        culture: culture || undefined,
        period: obj.period || undefined,
        dynasty: obj.dynasty || undefined,
        artist: obj.artistDisplayName || undefined,
        object_begin_date: obj.objectBeginDate,
        object_end_date: obj.objectEndDate,
        medium: medium || undefined,
        dimensions: obj.dimensions || undefined,
        classification: obj.classification || undefined,
        geography: geography.length ? geography : undefined,
        excavation: obj.excavation || undefined,
        credit_line: creditLine || undefined,
        geography_mentions_africa: /africa/i.test(geography.join(' ')),
      },
      tags: Array.from(tags),
      entityData: {
        media: [
          {
            title,
            mediaType: 'image',
            mimeType: guessImageMime(obj.primaryImage),
            fileUrl: obj.primaryImage,
            thumbnailUrl: obj.primaryImageSmall || obj.primaryImage,
            sourceMediaId: `met-${id}-primary`,
            rights,
            metadata: { accession_number: obj.accessionNumber, additional_images: obj.additionalImages?.length || 0 },
          },
        ],
      },
    };
  }
}
