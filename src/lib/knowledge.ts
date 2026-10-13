import type { Article, Profile } from '@/types'

export interface KnowledgeRecord {
  id: string
  slug: string | null
  title: string
  summary: string | null
  content: string | null
  knowledge_type: string | null
  source_url: string | null
  original_url: string | null
  license_type: string | null
  license_url: string | null
  attribution: string | null
  country_codes: string[] | null
  time_period: string | null
  created_at: string | null
  verification_status?: string | null
  sources?: { name: string | null; slug: string | null; base_url?: string | null } | null
  media?: Array<{ file_url: string | null; thumbnail_url: string | null; media_type?: string | null }> | null
}

/** PostgREST filter that hides records moderators have flagged. */
export const NOT_FLAGGED = 'verification_status.is.null,verification_status.neq.flagged'

export const KNOWLEDGE_SELECT =
  'id, slug, title, summary, content, knowledge_type, source_url, original_url, license_type, license_url, attribution, country_codes, time_period, created_at, verification_status, sources(name, slug, base_url), media(file_url, thumbnail_url, media_type)'

const LICENSE_LABELS: Record<string, string> = {
  public_domain: 'Public domain',
  cc0: 'CC0',
  cc_by: 'CC BY',
  cc_by_sa: 'CC BY-SA',
  cc_by_nc: 'CC BY-NC',
  cc_by_nc_sa: 'CC BY-NC-SA',
  copyrighted_metadata_only: 'Metadata only (rights reserved)',
}

export function licenseLabel(license: string | null | undefined): string {
  if (!license) return 'Rights not stated'
  return LICENSE_LABELS[license] ?? license.replace(/_/g, ' ')
}

export function knowledgeTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Archive record'
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Imported file names make poor titles ("MaliDjennéMosquée", "Sudan, Nubian pyramids (31444835441)",
 * "Mask 2   animal   African Art   … (2022 04 06 02.15.27 by Terry Ballard)"). Tidy them for display.
 */
export function cleanRecordTitle(raw: string): string {
  let t = raw.replace(/\.(jpe?g|png|tiff?|webp|gif)$/i, '').replace(/_/g, ' ')
  t = t.replace(/\s*\((?:\d{4}[\s\d.:-]*)?(?:by [^)]+)?\)\s*$/i, '')
  t = t.replace(/\s*\(\d{6,}\)\s*$/, '').replace(/\.?\s*Wellcome [A-Z]\d{5,}$/, '')
  const parts = t.split(/\s{2,}/).map(p => p.trim()).filter(Boolean)
  if (parts.length > 2) t = `${parts[0]}, ${parts[1]}`
  t = t.replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2')
  // Drop a trailing photo counter ("Great Mosque of Djenné 1") but keep inventory numbers ("A97 14 1").
  t = t.replace(/(\D)\s+\d{1,2}$/, '$1').replace(/\s+/g, ' ').trim()
  return t || raw
}

/** Strips wiki link prefixes from imported descriptions ("w:Great Mosque", "en:Djenné"). */
export function cleanRecordText(raw: string | null | undefined): string | null {
  if (!raw) return null
  const t = raw
    // Providers occasionally include HTML fragments in otherwise plain descriptions.
    .replace(/<[^>]*>/g, ' ')
    .replace(/(^|[\s(,])(?:w|en|fr|commons|wikipedia):(?=\S)/gi, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return t || null
}

/**
 * Creates a card-friendly description while preserving the provider's full text
 * for the record detail page. Imported media descriptions often append licence
 * instructions that are useful as metadata but poor homepage copy.
 */
export function recordExcerpt(raw: string | null | undefined, maxLength = 260): string | null {
  const cleaned = cleanRecordText(raw)
  if (!cleaned) return null

  const summary = cleaned
    .split(/\b(?:permission to use|please check (?:the )?licen[cs]e|this (?:image|photo|file) is (?:available|licensed)|for attribution|copyright notice)\b/i)[0]
    .trim()

  if (!summary) return null
  if (summary.length <= maxLength) return summary

  const shortened = summary.slice(0, maxLength + 1)
  const sentenceEnd = Math.max(shortened.lastIndexOf('. '), shortened.lastIndexOf('! '), shortened.lastIndexOf('? '))
  const wordEnd = shortened.lastIndexOf(' ')
  const end = sentenceEnd >= Math.floor(maxLength * 0.55) ? sentenceEnd + 1 : wordEnd
  return `${summary.slice(0, Math.max(1, end)).trimEnd()}…`
}

/** Keeps period strings that describe history ("1100–1450 CE", "16th century"); drops upload years and noise. */
export function usefulPeriod(period: string | null | undefined): string | null {
  if (!period) return null
  const p = period.trim()
  return /(century|centuries|BCE|\bBC\b|\bCE\b|\bAD\b|\bc\.\s*\d|\d\s*[–-]\s*\d|\d{3,4}s\b)/i.test(p) ? p : null
}

/** 1235 → "1235", 300 → "300 CE", -750 → "750 BCE"; prefixes "c." when approximate. */
export function formatYear(year: number | null | undefined, approximate = false): string | null {
  if (year === null || year === undefined) return null
  const prefix = approximate ? 'c. ' : ''
  return year < 0 ? `${prefix}${Math.abs(year)} BCE` : `${prefix}${year}${year < 1000 ? ' CE' : ''}`
}

export function yearSpan(from: string | null, to: string | null): string | null {
  if (from && to) return `${from} – ${to}`
  return from ? `from ${from}` : to ? `until ${to}` : null
}

function isImageUrl(url: string | null | undefined): url is string {
  return !!url && (/\.(jpe?g|png|webp|gif)$/i.test(url) || url.includes('upload.wikimedia.org'))
}

/** The 3D scan attached to a record, if any (embedded from Sketchfab, never downloaded). */
export function recordModel3d(item: KnowledgeRecord): { embedUrl: string; poster: string | null } | null {
  const m = item.media?.find(x => x.media_type === '3d_model' && x.file_url)
  return m ? { embedUrl: m.file_url as string, poster: m.thumbnail_url } : null
}

export function recordImage(item: KnowledgeRecord): string | null {
  const media = item.media?.find(m => m.media_type !== '3d_model' && (m.thumbnail_url || m.file_url))
    ?? item.media?.find(m => m.thumbnail_url)
  if (media) return media.thumbnail_url || media.file_url
  if (isImageUrl(item.original_url)) return item.original_url
  return null
}

/** Presents an ingested knowledge record through the Article card UI without inventing data. */
export function knowledgeItemToArticle(item: KnowledgeRecord): Article {
  const sourceName = item.sources?.name || 'Open archive source'
  const author: Profile = {
    id: `source-${item.sources?.slug ?? 'unknown'}`,
    username: '',
    full_name: sourceName,
    bio: null,
    avatar_url: null,
    cover_url: null,
    country: null,
    website: item.sources?.base_url ?? null,
    languages: [],
    role: 'contributor',
    is_verified: false,
    followers_count: 0,
    following_count: 0,
    articles_count: 0,
    total_views: 0,
    created_at: '',
    updated_at: '',
  }
  const typeLabel = knowledgeTypeLabel(item.knowledge_type)

  return {
    id: item.id,
    is_record: true,
    has_3d: !!recordModel3d(item),
    author_id: author.id,
    title: cleanRecordTitle(item.title),
    slug: item.slug || item.id,
    excerpt: recordExcerpt(item.summary) || recordExcerpt(item.content),
    content: cleanRecordText(item.content || item.summary) || '',
    cover_image: recordImage(item),
    status: 'published',
    category_id: item.knowledge_type,
    reading_time: Math.max(1, Math.ceil((item.content || item.summary || '').split(/\s+/).length / 200)),
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
    bookmarks_count: 0,
    is_featured: false,
    references_list: null,
    language: 'en',
    published_at: item.created_at,
    created_at: item.created_at ?? '',
    updated_at: item.created_at ?? '',
    youtube_embed: null,
    country: item.country_codes?.[0] ?? null,
    time_period: usefulPeriod(item.time_period),
    author,
    category: {
      id: item.knowledge_type ?? 'record',
      name: typeLabel,
      slug: '',
      description: null,
      icon: null,
      color: null,
      parent_id: null,
      articles_count: 0,
      created_at: '',
    },
  }
}
