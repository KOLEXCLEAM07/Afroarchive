/**
 * AfroArchive Ingestion Framework - Sketchfab 3D Importer
 * Imports openly licensed 3D scans of African objects published by museums,
 * libraries and university labs on Sketchfab. Models are embedded from
 * Sketchfab (never downloaded or rehosted) and credited per their licence.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions, LicenseType } from '../types';

/** Institutional accounts whose African collections we import (username → display name). */
const INSTITUTIONS: Record<string, string> = {
  bclspecialcollections: 'Broward County Library Special Collections',
  GCIEL: 'Grinnell College Immersive Experiences Lab',
  'usf-idex-access3d': 'USF IDEx Access 3D Lab',
  varldskulturmuseerna: 'Världskulturmuseerna (Swedish National Museums of World Culture)',
  benkreimer: 'Ben Kreimer',
  bcds: 'Boston College Digital Scholarship',
}

/** Licences we accept. Non-commercial and no-derivatives licences are excluded by default. */
const LICENSES: Record<string, { type: LicenseType; url: string; label: string }> = {
  'CC Attribution': { type: 'cc_by', url: 'https://creativecommons.org/licenses/by/4.0/', label: 'CC BY 4.0' },
  'CC Attribution-ShareAlike': { type: 'cc_by_sa', url: 'https://creativecommons.org/licenses/by-sa/4.0/', label: 'CC BY-SA 4.0' },
  'CC0 Public Domain': { type: 'cc0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', label: 'CC0' },
}

const AFRICAN_TERMS = /\b(afric\w*|yoruba|yorùbá|benin|edo|ife|igbo|ibo|nok|ashanti|asante|akan|fante|dogon|bamana|bambara|senufo|senoufo|baule|baulé|dan|fang|kongo|bacongo|luba|kuba|chokwe|songye|lega|lwala|punu|guro|bete|kulango|mossi|tikar|ekoi|ejagham|bamileke|bamena|kwele|mama|wadja|atie|yaka|makonde|zulu|ndebele|shona|zimbabwe|ethiopia\w*|lalibela|aksum|axum|egypt\w*|nubia\w*|mali|ghana|nigeria|cameroon|congo|gabon|kenya|maasai|swahili|tanzania|mende|gelede|egungun|ibeji|nkisi|ty-?wara|chi-?wara)\b/i

const COUNTRY_CODES: Record<string, string> = {
  nigeria: 'NG', ghana: 'GH', mali: 'ML', 'burkina faso': 'BF', 'ivory coast': 'CI', "cote d'ivoire": 'CI', 'côte d’ivoire': 'CI',
  cameroon: 'CM', gabon: 'GA', congo: 'CD', drc: 'CD', 'democratic republic of the congo': 'CD', angola: 'AO',
  zimbabwe: 'ZW', 'south africa': 'ZA', ethiopia: 'ET', egypt: 'EG', sudan: 'SD', kenya: 'KE', tanzania: 'TZ',
  'sierra leone': 'SL', liberia: 'LR', guinea: 'GN', senegal: 'SN', benin: 'BJ', togo: 'TG', mozambique: 'MZ',
}

export interface SketchfabModel {
  uid: string
  name: string
  description?: string
  tags?: Array<{ name: string }>
  license?: { uid?: string; label?: string } | null
  embedUrl?: string
  viewerUrl?: string
  publishedAt?: string
  user?: { username: string; displayName: string }
  thumbnails?: { images: Array<{ url: string; width: number; height: number }> }
}

export class SketchfabImporter extends BaseImporter<SketchfabModel> {
  readonly name = 'Sketchfab 3D Importer'
  readonly sourceSlug = 'sketchfab'
  readonly sourceName = 'Sketchfab (institutional 3D scans)'
  readonly connectorType = 'rest_api'
  readonly baseUrl = 'https://sketchfab.com'

  protected isTrustedAfricanSource(): boolean {
    return true
  }

  /** Cursor format: "<institutionIndex>|<next page URL or empty>". */
  async fetchBatch(cursor?: string | number, limit = 24, options?: ConnectorOptions): Promise<BatchFetchResult<SketchfabModel>> {
    void options
    const usernames = Object.keys(INSTITUTIONS)
    let cur = String(cursor ?? '0|')

    // A page can contain no African, openly licensed models; keep going until one does (or we run out).
    for (let guard = 0; guard < 60; guard++) {
      const [idxRaw, pageUrl] = cur.split('|')
      let idx = Number(idxRaw) || 0
      if (idx >= usernames.length) return { records: [], nextCursor: null, hasMore: false }

      const url = pageUrl || `https://api.sketchfab.com/v3/models?user=${encodeURIComponent(usernames[idx])}&count=${Math.min(limit, 24)}&sort_by=-likeCount`
      const res = await fetch(url, { headers: { 'User-Agent': 'AfroArchive-Ingestion/1.0 (open heritage archive)' } })
      if (!res.ok) throw new Error(`Sketchfab API error ${res.status}`)
      const json = (await res.json()) as { results: SketchfabModel[]; next: string | null }

      const records = (json.results || []).filter(m => {
        const text = `${m.name} ${m.description ?? ''} ${(m.tags ?? []).map(t => t.name).join(' ')}`
        return AFRICAN_TERMS.test(text) && !!m.license?.label && m.license.label in LICENSES
      })

      let next: string | null
      if (json.next) next = `${idx}|${json.next}`
      else { idx += 1; next = idx < usernames.length ? `${idx}|` : null }

      await this.sleep(400)
      if (records.length > 0 || next === null) return { records, nextCursor: next, hasMore: next !== null }
      cur = next
    }
    return { records: [], nextCursor: null, hasMore: false }
  }

  async normalize(m: SketchfabModel): Promise<NormalizedItem | null> {
    const lic = m.license?.label ? LICENSES[m.license.label] : undefined
    if (!lic) return null

    const institution = (m.user && INSTITUTIONS[m.user.username]) || m.user?.displayName || 'Sketchfab contributor'
    const title = m.name.replace(/\s+/g, ' ').trim()
    const tags = (m.tags ?? []).map(t => t.name.toLowerCase())
    const description = (m.description ?? '').replace(/\s+/g, ' ').trim()

    const countryCodes = Array.from(new Set(
      tags.concat(description.toLowerCase().split(/[,.;()]/).map(s => s.trim()))
        .map(t => COUNTRY_CODES[t]).filter((c): c is string => !!c)
    ))

    const thumbs = (m.thumbnails?.images ?? []).slice().sort((a, b) => b.width - a.width)
    const thumb = thumbs.find(i => i.width <= 1024)?.url ?? thumbs[0]?.url
    const embedUrl = m.embedUrl || `https://sketchfab.com/models/${m.uid}/embed`
    const attribution = `“${title}” by ${institution}, ${lic.label}, via Sketchfab`

    const slug = `${title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 70)}-3d-${m.uid.slice(0, 8)}`

    return {
      slug,
      title,
      summary: description ? description.slice(0, 280) + (description.length > 280 ? '…' : '') : `3D scan published by ${institution}.`,
      content: description || undefined,
      knowledgeType: 'cultural_artifact',
      sourceSlug: this.sourceSlug,
      sourceRecordId: m.uid,
      sourceUrl: m.viewerUrl || `https://sketchfab.com/3d-models/${m.uid}`,
      originalUrl: m.viewerUrl,
      externalIds: { sketchfab: m.uid },
      rights: { licenseType: lic.type, licenseUrl: lic.url, attribution, canRehost: false, isMetadataOnly: false },
      languageCode: 'en',
      countryCodes,
      datePublished: m.publishedAt,
      metadata: { institution, has3d: true, embedUrl, trustedAfricanSource: true },
      tags: Array.from(new Set(['3d-model', 'african-art', ...tags.filter(t => /^[a-z0-9-]{3,30}$/.test(t) && !/scan|library|broward|grinnell|gciel|usf|3d/.test(t))])).slice(0, 10),
      entityData: {
        media: [
          {
            title: `${title} (3D model)`,
            mediaType: '3d_model',
            mimeType: 'text/html',
            fileUrl: embedUrl,
            thumbnailUrl: thumb,
            sourceMediaId: m.uid,
            rights: { licenseType: lic.type, licenseUrl: lic.url, attribution, canRehost: false, isMetadataOnly: false },
            metadata: { provider: 'sketchfab', viewerUrl: m.viewerUrl },
          },
          ...(thumb ? [{
            title: `${title} (preview)`,
            mediaType: 'image' as const,
            mimeType: 'image/jpeg',
            fileUrl: thumb,
            thumbnailUrl: thumb,
            sourceMediaId: `${m.uid}-thumb`,
            rights: { licenseType: lic.type, licenseUrl: lic.url, attribution, canRehost: false, isMetadataOnly: false },
          }] : []),
        ],
      },
    }
  }
}
