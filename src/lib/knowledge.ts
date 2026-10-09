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
  media?: Array<{ file_url: string | null; thumbnail_url: string | null }> | null
}

/** PostgREST filter that hides records moderators have flagged. */
export const NOT_FLAGGED = 'verification_status.is.null,verification_status.neq.flagged'

export const KNOWLEDGE_SELECT =
  'id, slug, title, summary, content, knowledge_type, source_url, original_url, license_type, license_url, attribution, country_codes, time_period, created_at, verification_status, sources(name, slug, base_url), media(file_url, thumbnail_url)'

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

export function recordImage(item: KnowledgeRecord): string | null {
  const media = item.media?.find(m => m.thumbnail_url || m.file_url)
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
    author_id: author.id,
    title: item.title,
    slug: item.slug || item.id,
    excerpt: item.summary || (item.content ? item.content.slice(0, 180).trimEnd() + '…' : null),
    content: item.content || item.summary || '',
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
    time_period: item.time_period,
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
