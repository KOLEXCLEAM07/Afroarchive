/**
 * AfroArchive Ingestion Framework - Art Institute of Chicago Importer
 *
 * Uses the Elasticsearch-backed search endpoint (POST JSON) restricted to the
 * "Arts of Africa" department (PC-1) and public-domain works, 100 records per
 * request with an explicit `fields` list, sorted by id for stable pagination.
 *
 * Licensing: AIC data is CC0 EXCEPT the long `description` field, which is
 * CC BY 4.0. To keep records uniformly CC0 we only use `short_description`.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions, RightsAssessment } from '../types';
import { fetchJson, HttpError, Throttle, cleanText, stripHtml, kebab, labelledLines, leadSentences } from '../http';
import { detectAfricanCountryCodes } from '../countries';

export interface ArticArtwork {
  id: number;
  title?: string;
  date_display?: string | null;
  place_of_origin?: string | null;
  artist_display?: string | null;
  medium_display?: string | null;
  dimensions?: string | null;
  credit_line?: string | null;
  main_reference_number?: string | null;
  image_id?: string | null;
  classification_title?: string | null;
  style_title?: string | null;
  short_description?: string | null;
  thumbnail?: { alt_text?: string | null; width?: number; height?: number } | null;
  is_public_domain?: boolean;
  department_title?: string | null;
}

const FIELDS = [
  'id', 'title', 'date_display', 'place_of_origin', 'artist_display', 'medium_display', 'dimensions',
  'credit_line', 'main_reference_number', 'image_id', 'classification_title', 'style_title',
  'short_description', 'thumbnail', 'is_public_domain', 'department_title',
].join(',');

const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';
const IIIF = 'https://www.artic.edu/iiif/2';

export class ArticImporter extends BaseImporter<ArticArtwork> {
  readonly name = 'Art Institute of Chicago Importer';
  readonly sourceSlug = 'art-institute-chicago';
  readonly sourceName = 'Art Institute of Chicago';
  readonly connectorType = 'artic_api';
  readonly baseUrl = 'https://api.artic.edu/api/v1';

  protected batchSize = 100;
  // Unauthenticated limit is 60 requests/minute; one request every 1.5 s is well under it.
  private readonly throttle = new Throttle(1500);

  protected isTrustedAfricanSource(): boolean {
    return true; // query is restricted to the Arts of Africa department
  }

  async fetchBatch(
    cursor?: string | number,
    limit: number = 100,
    _options?: ConnectorOptions
  ): Promise<BatchFetchResult<ArticArtwork>> {
    void _options;
    // Cursor is the record offset; the API pages in fixed blocks of 100.
    const offset = typeof cursor === 'number' ? cursor : parseInt(String(cursor ?? 0), 10) || 0;
    const pageSize = 100;
    const page = Math.floor(offset / pageSize) + 1;

    const body = {
      query: {
        bool: {
          filter: [{ term: { is_public_domain: true } }, { term: { department_id: 'PC-1' } }],
        },
      },
      sort: [{ id: 'asc' }],
      limit: pageSize,
      page,
      fields: FIELDS,
    };

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      'Content-Type': 'application/json',
      'AIC-User-Agent': 'AfroArchive-Ingestion/1.0 (open heritage archive)',
    };

    let json: { pagination: { total: number }; data: ArticArtwork[] };
    try {
      // api.artic.edu rejects non-browser User-Agents with 403, so send a browser one here.
      json = await fetchJson<{ pagination: { total: number }; data: ArticArtwork[] }>(`${this.baseUrl}/artworks/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        throttle: this.throttle,
      });
    } catch (err) {
      // Their bot protection flags Node's TLS fingerprint (curl/PowerShell pass fine),
      // so fall back to the system curl for the exact same request.
      if (err instanceof HttpError && err.status === 403) {
        console.warn('   ↻ POST blocked (403); retrying via system curl...');
        json = await postViaCurl(`${this.baseUrl}/artworks/search`, body, headers['User-Agent']);
      } else {
        throw err;
      }
    }

    const pageRecords = json.data || [];
    const within = offset - (page - 1) * pageSize;
    const records = pageRecords.slice(within, within + limit);
    const next = offset + records.length;
    const hasMore = records.length > 0 && next < (json.pagination?.total ?? 0);
    return { records, nextCursor: hasMore ? next : null, hasMore };
  }

  async normalize(art: ArticArtwork): Promise<NormalizedItem | null> {
    if (art.is_public_domain !== true || !art.image_id) return null;
    const title = cleanText(art.title);
    if (!title) return null;

    const id = String(art.id);
    const creditLine = cleanText(art.credit_line);
    const medium = cleanText(art.medium_display);
    const artistLines = (art.artist_display || '').split('\n').map(cleanText).filter(Boolean);
    const shortDescription = stripHtml(art.short_description);

    const countryCodes = detectAfricanCountryCodes(art.place_of_origin, art.artist_display);

    const lead = [title, art.style_title ? capitalizeWords(art.style_title) : '', cleanText(art.place_of_origin)].filter(Boolean).join(', ');
    const summary = shortDescription ? leadSentences(shortDescription) : `${lead}.${medium ? ` ${medium}.` : ''}`;

    const facts = labelledLines([
      ['Date', art.date_display],
      ['Artist / origin', artistLines.join('; ')],
      ['Place of origin', art.place_of_origin],
      ['Medium', medium],
      ['Dimensions', art.dimensions],
      ['Classification', art.classification_title],
      ['Credit line', creditLine],
      ['Reference number', art.main_reference_number],
    ]);
    const content = [shortDescription, facts].filter(Boolean).join('\n\n');

    const attributionCredit = creditLine.replace(/^The Art Institute of Chicago,?\s*/i, '');
    const rights: RightsAssessment = {
      licenseType: 'cc0',
      licenseUrl: CC0_URL,
      attribution: `Art Institute of Chicago${attributionCredit ? `, ${attributionCredit}` : ''}`,
      rightsStatement: 'Public-domain artwork; image and data released under CC0 by the Art Institute of Chicago.',
      canRehost: true,
      isMetadataOnly: false,
    };

    const tags = new Set<string>(['museum-object', 'art-institute-chicago', 'african-art']);
    if (art.classification_title) tags.add(kebab(art.classification_title, 40));
    if (art.style_title) tags.add(kebab(art.style_title, 40));

    return {
      slug: `${kebab(title) || 'artwork'}-artic-${id}`,
      title,
      summary,
      content: content || undefined,
      knowledgeType: 'cultural_artifact',
      sourceSlug: this.sourceSlug,
      sourceRecordId: id,
      sourceUrl: `https://www.artic.edu/artworks/${id}`,
      originalUrl: `https://www.artic.edu/artworks/${id}`,
      externalIds: { artic: id },
      rights,
      languageCode: 'en',
      countryCodes,
      timePeriod: cleanText(art.date_display) || undefined,
      metadata: {
        artic_id: art.id,
        reference_number: art.main_reference_number || undefined,
        department: art.department_title || undefined,
        place_of_origin: art.place_of_origin || undefined,
        artist_display: artistLines.length ? artistLines : undefined,
        medium: medium || undefined,
        dimensions: art.dimensions || undefined,
        classification: art.classification_title || undefined,
        style: art.style_title || undefined,
        credit_line: creditLine || undefined,
        image_id: art.image_id,
      },
      tags: Array.from(tags),
      entityData: {
        media: [
          {
            title,
            description: cleanText(art.thumbnail?.alt_text) || undefined,
            mediaType: 'image',
            mimeType: 'image/jpeg',
            fileUrl: `${IIIF}/${art.image_id}/full/843,/0/default.jpg`,
            thumbnailUrl: `${IIIF}/${art.image_id}/full/400,/0/default.jpg`,
            sourceMediaId: `artic-${art.image_id}`,
            rights,
            width: art.thumbnail?.width,
            height: art.thumbnail?.height,
            metadata: { iiif_base: `${IIIF}/${art.image_id}` },
          },
        ],
      },
    };
  }
}

function capitalizeWords(s: string): string {
  return s.replace(/(^|[\s-])(\p{Ll})/gu, (_m, pre: string, ch: string) => pre + ch.toUpperCase());
}

/** POSTs JSON via the system curl (its TLS fingerprint passes bot protection that blocks Node fetch). */
async function postViaCurl(url: string, body: unknown, userAgent: string): Promise<{ pagination: { total: number }; data: ArticArtwork[] }> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  const payload = JSON.stringify(body);
  const { stdout } = await run('curl.exe', [
    '-s', '-m', '60',
    '-A', userAgent,
    '-H', 'Content-Type: application/json',
    '-H', 'Accept: application/json',
    '--data-binary', '@-',
    url,
  ], { input: payload, maxBuffer: 32 * 1024 * 1024 });
  const parsed = JSON.parse(stdout) as { pagination?: { total: number }; data?: ArticArtwork[]; status?: number };
  if (!parsed || !Array.isArray(parsed.data)) {
    throw new Error(`curl fallback returned unexpected response: ${stdout.slice(0, 160)}`);
  }
  return { pagination: parsed.pagination ?? { total: 0 }, data: parsed.data };
}
