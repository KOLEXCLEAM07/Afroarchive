/**
 * AfroArchive Ingestion Framework - Cleveland Museum of Art Importer
 *
 * Open Access API, African Art department, CC0 objects with images only.
 * All Open Access data and images for CC0 objects are released under CC0.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions, RightsAssessment } from '../types';
import { fetchJson, Throttle, cleanText, stripHtml, kebab, labelledLines, guessImageMime, leadSentences } from '../http';
import { detectAfricanCountryCodes } from '../countries';

interface ClevelandImage {
  url?: string;
  width?: string | number;
  height?: string | number;
  filename?: string;
}

export interface ClevelandArtwork {
  id: number;
  accession_number?: string;
  share_license_status?: string;
  title?: string;
  tombstone?: string;
  creation_date?: string | null;
  creation_date_earliest?: number | null;
  creation_date_latest?: number | null;
  culture?: string[] | null;
  technique?: string | null;
  department?: string | null;
  type?: string | null;
  measurements?: string | null;
  creditline?: string | null;
  description?: string | null;
  wall_description?: string | null;
  url?: string | null;
  creators?: Array<{ description?: string; role?: string }> | null;
  images?: { web?: ClevelandImage; print?: ClevelandImage; full?: ClevelandImage } | null;
}

const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';

export class ClevelandImporter extends BaseImporter<ClevelandArtwork> {
  readonly name = 'Cleveland Museum of Art Importer';
  readonly sourceSlug = 'cleveland-museum-of-art';
  readonly sourceName = 'Cleveland Museum of Art';
  readonly connectorType = 'cma_open_access_api';
  readonly baseUrl = 'https://openaccess-api.clevelandart.org/api';

  protected batchSize = 100;
  private readonly throttle = new Throttle(1000);

  protected isTrustedAfricanSource(): boolean {
    return true; // query is restricted to the African Art department
  }

  async fetchBatch(
    cursor?: string | number,
    limit: number = 100,
    _options?: ConnectorOptions
  ): Promise<BatchFetchResult<ClevelandArtwork>> {
    void _options;
    const skip = typeof cursor === 'number' ? cursor : parseInt(String(cursor ?? 0), 10) || 0;
    const params = new URLSearchParams({
      department: 'African Art',
      has_image: '1',
      cc0: '1',
      limit: String(Math.min(limit, 100)),
      skip: String(skip),
    });
    const json = await fetchJson<{ info: { total: number }; data: ClevelandArtwork[] }>(
      `${this.baseUrl}/artworks/?${params.toString()}`,
      { throttle: this.throttle, timeoutMs: 60000 }
    );
    const records = json.data || [];
    const next = skip + records.length;
    const hasMore = records.length > 0 && next < (json.info?.total ?? 0);
    return { records, nextCursor: hasMore ? next : null, hasMore };
  }

  async normalize(art: ClevelandArtwork): Promise<NormalizedItem | null> {
    if (art.share_license_status !== 'CC0') return null;
    const image = art.images?.web?.url ? art.images.web : art.images?.print;
    if (!image?.url) return null;
    const full: ClevelandImage = art.images?.print?.url ? art.images.print : image;
    const title = cleanText(art.title);
    if (!title) return null;

    const id = String(art.id);
    const cultures = (art.culture || []).map(cleanText).filter(Boolean);
    const technique = cleanText(art.technique);
    const creditLine = cleanText(art.creditline);
    const description = stripHtml(art.description);
    const wallDescription = stripHtml(art.wall_description);
    const creators = (art.creators || []).map((c) => cleanText(c.description)).filter(Boolean);

    const countryCodes = detectAfricanCountryCodes(...cultures);

    const lead = [title, cultures[0]].filter(Boolean).join(', ');
    const composed = `${lead}.${technique ? ` ${capitalize(technique)}.` : ''}`;
    const longest = wallDescription || description;
    const summary = longest ? leadSentences(longest) : composed;

    const facts = labelledLines([
      ['Date', art.creation_date],
      ['Culture', cultures.join('; ')],
      ['Creator', creators.join('; ')],
      ['Type', art.type],
      ['Technique', technique],
      ['Measurements', art.measurements],
      ['Credit line', creditLine],
      ['Accession number', art.accession_number],
    ]);
    const longText = [wallDescription, description && description !== wallDescription ? description : ''].filter(Boolean).join('\n\n');
    const content = [longText, facts].filter(Boolean).join('\n\n');

    const rights: RightsAssessment = {
      licenseType: 'cc0',
      licenseUrl: CC0_URL,
      attribution: `Cleveland Museum of Art${creditLine ? `, ${creditLine}` : ''}`,
      rightsStatement: 'Open Access: image and data released under CC0 by the Cleveland Museum of Art.',
      canRehost: true,
      isMetadataOnly: false,
    };

    const tags = new Set<string>(['museum-object', 'cleveland-museum-of-art', 'african-art']);
    if (art.type) tags.add(kebab(art.type, 40));

    const sourceUrl = art.url || `https://www.clevelandart.org/art/${art.accession_number || id}`;

    return {
      slug: `${kebab(title) || 'artwork'}-cma-${id}`,
      title,
      summary,
      content: content || undefined,
      knowledgeType: 'cultural_artifact',
      sourceSlug: this.sourceSlug,
      sourceRecordId: id,
      sourceUrl,
      originalUrl: sourceUrl,
      externalIds: { cleveland: id },
      rights,
      languageCode: 'en',
      countryCodes,
      timePeriod: cleanText(art.creation_date) || undefined,
      metadata: {
        cleveland_id: art.id,
        accession_number: art.accession_number,
        culture: cultures.length ? cultures : undefined,
        technique: technique || undefined,
        type: art.type || undefined,
        measurements: art.measurements || undefined,
        creators: creators.length ? creators : undefined,
        creation_date_earliest: art.creation_date_earliest ?? undefined,
        creation_date_latest: art.creation_date_latest ?? undefined,
        credit_line: creditLine || undefined,
        tombstone: art.tombstone || undefined,
      },
      tags: Array.from(tags),
      entityData: {
        media: [
          {
            title,
            mediaType: 'image',
            mimeType: guessImageMime(image.url),
            fileUrl: full.url || image.url,
            thumbnailUrl: image.url,
            sourceMediaId: `cma-${id}`,
            rights,
            width: full.width ? Number(full.width) : undefined,
            height: full.height ? Number(full.height) : undefined,
            metadata: { accession_number: art.accession_number },
          },
        ],
      },
    };
  }
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
