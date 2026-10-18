/**
 * Shared query layer for `knowledge_items`.
 *
 * Two problems this solves, both of which used to be re-implemented — slightly
 * differently — on every page that browses records:
 *
 *  1. The moderation filter and a search term must be combined into a *single*
 *     PostgREST `or` parameter. Sending two `or` params (which the browse pages
 *     did) silently drops the first one, so a searched view leaked flagged
 *     records. `recordFilter()` below builds the correct combined expression.
 *
 *  2. PostgREST never returns more than 1,000 rows in one response, so anything
 *     that needs "all" rows has to page through them. `fetchAllRows()` is that
 *     loop, in one place instead of copied per caller.
 */

import { supabase } from './supabase'
import { ilikeAny } from './query'
import { KNOWLEDGE_SELECT, NOT_FLAGGED, type KnowledgeRecord } from './knowledge'

/** PostgREST caps a single response at this many rows. */
export const MAX_ROWS_PER_REQUEST = 1000

/** Default page size for the paged browse views. */
export const PAGE_SIZE = 24

/** PostgREST array literal, e.g. ("work","draft"). */
const inList = (values: string[]): string =>
  `(${values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',')})`

/**
 * The filter that hides records moderators have flagged.
 *
 * Returned *without* surrounding parentheses on purpose: `supabase.or(value)`
 * already wraps its argument in `(...)`, so adding our own produces `((...))`,
 * which PostgREST rejects.
 */
export function recordVisibilityFilter(): string {
  return NOT_FLAGGED
}

/**
 * Visibility plus an optional search, as one `or` value (see above: the caller's
 * `.or()` supplies the outer parentheses).
 *
 * The search branch is wrapped in `and(...)` rather than sent as a second `or`
 * param, because a second `or` param would override this one.
 */
export function recordFilter(search?: string | null, columns: string[] = ['title', 'summary']): string {
  const term = (search ?? '').trim()
  if (!term) return recordVisibilityFilter()
  return `and(or(${NOT_FLAGGED}),or(${ilikeAny(columns, term)}))`
}

export interface KnowledgePageSpec {
  /** Zero-based page index. */
  page?: number
  pageSize?: number
  /** Override the selected columns, e.g. to force an inner join on `media`. */
  select?: string
  /** Restrict to these `knowledge_type` values. */
  types?: string[] | null
  /** Exclude these `knowledge_type` values. */
  excludeTypes?: string[]
  /** Keep rows whose `country_codes` overlap this list (ISO alpha-2). */
  countryCodes?: string[] | null
  /** Keep only rows that have at least one 3D model. Needs a `media!inner` select. */
  only3d?: boolean
  /** Case-insensitive substring search across `searchColumns`. */
  search?: string | null
  searchColumns?: string[]
  order?: string
  ascending?: boolean
}

export interface KnowledgePage<T> {
  rows: T[]
  total: number
}

/**
 * Fetches one page of records, newest first, with the moderation filter always
 * applied. Throws on a database error so callers can surface a real message.
 */
export async function fetchKnowledgePage<T = KnowledgeRecord>(
  spec: KnowledgePageSpec = {},
): Promise<KnowledgePage<T>> {
  const pageSize = spec.pageSize ?? PAGE_SIZE
  const from = (spec.page ?? 0) * pageSize

  let req = supabase
    .from('knowledge_items')
    .select(spec.select ?? KNOWLEDGE_SELECT, { count: 'exact' })
    .or(recordFilter(spec.search, spec.searchColumns))

  if (spec.types?.length) req = req.in('knowledge_type', spec.types)
  if (spec.excludeTypes?.length) req = req.not('knowledge_type', 'in', inList(spec.excludeTypes))
  if (spec.countryCodes?.length) req = req.overlaps('country_codes', spec.countryCodes)
  if (spec.only3d) req = req.eq('media.media_type', '3d_model')

  const { data, error, count } = await req
    .order(spec.order ?? 'created_at', { ascending: spec.ascending ?? false })
    .order('id')
    .range(from, from + pageSize - 1)

  if (error) throw error
  return { rows: (data ?? []) as unknown as T[], total: count ?? 0 }
}

/** Fetches a bounded set of records by id, honouring the moderation filter. */
export async function fetchKnowledgeByIds<T = KnowledgeRecord>(
  ids: string[],
  select = 'id, slug, title, knowledge_type, verification_status',
): Promise<T[]> {
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('knowledge_items')
    .select(select)
    .or(recordVisibilityFilter())
    .in('id', ids)
  if (error) throw error
  return (data ?? []) as unknown as T[]
}

/**
 * Fetches records by slug. Rows come back in the order the slugs were given, so
 * callers can keep an editorial ordering; missing slugs are simply skipped.
 */
export async function fetchKnowledgeBySlugs<T = KnowledgeRecord>(
  slugs: string[],
  select = KNOWLEDGE_SELECT,
): Promise<T[]> {
  if (!slugs.length) return []
  const { data, error } = await supabase
    .from('knowledge_items')
    .select(select)
    .or(recordVisibilityFilter())
    .in('slug', slugs)
  if (error) throw error
  const rows = (data ?? []) as unknown as Array<T & { slug: string | null }>
  const bySlug = new Map<string, T>()
  for (const row of rows) if (row.slug) bySlug.set(row.slug, row)
  return slugs.map((s) => bySlug.get(s)).filter((r): r is T => r !== undefined)
}

/**
 * Reads every row a query matches, paging around the 1,000-row response cap.
 * `build` receives an inclusive `[from, to]` range.
 */
export async function fetchAllRows<T = unknown>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
  maxPages = 40,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = []
  for (let page = 0; page < maxPages; page++) {
    const from = page * MAX_ROWS_PER_REQUEST
    const { data, error } = await build(from, from + MAX_ROWS_PER_REQUEST - 1)
    if (error) return { data: rows, error }
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < MAX_ROWS_PER_REQUEST) break
  }
  return { data: rows, error: null }
}

/** Deterministic cache key from a base name and plain, serialisable parts. */
export function queryKey(base: string, parts: Record<string, unknown> = {}): string {
  const entries = Object.keys(parts)
    .sort()
    .map((k) => `${k}=${JSON.stringify(parts[k] ?? null)}`)
  return [base, ...entries].join('|')
}
