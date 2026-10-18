import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Generic "page through a list" hook with a small in-memory cache.
 *
 * Before this existed, every browse view hand-rolled the same
 * fetch-page-zero / append-later-pages / track-loading dance, and navigating
 * away and back re-fetched everything. Callers now just describe how to fetch a
 * page and build a stable `key`; caching, de-duplication, cancellation and the
 * loading/error flags are handled here.
 */

interface CacheEntry<T> {
  items: T[]
  total: number
  pages: number
  at: number
}

const CACHE_TTL_MS = 60_000
const CACHE_LIMIT = 50

/** Oldest-inserted first, so the first key is the one to evict. */
const cache = new Map<string, CacheEntry<unknown>>()

function readCache<T>(key: string): CacheEntry<T> | null {
  const hit = cache.get(key) as CacheEntry<T> | undefined
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit
}

function writeCache<T>(key: string, entry: CacheEntry<T>): void {
  cache.delete(key) // re-insert so eviction stays oldest-first
  cache.set(key, entry as CacheEntry<unknown>)
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

/**
 * Drops cached pages. Pass a prefix (e.g. a `queryKey` base) to target one
 * view, or nothing to clear everything — useful after a record is edited.
 */
export function invalidatePagedQuery(prefix?: string): void {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

function appendUnique<T>(prev: T[], next: T[], keyOf?: (item: T) => string): T[] {
  if (!keyOf) return [...prev, ...next]
  const seen = new Set(prev.map(keyOf))
  const out = [...prev]
  for (const item of next) {
    const id = keyOf(item)
    if (seen.has(id)) continue
    seen.add(id)
    out.push(item)
  }
  return out
}

const messageFor = (err: unknown): string =>
  err instanceof Error ? err.message : 'Could not load records'

export interface PagedQueryOptions<T> {
  /**
   * Stable identity for the query (see `queryKey`). Pass `null` to disable the
   * hook, e.g. when a filter means the list should be empty.
   */
  key: string | null
  /** Called with a zero-based page index. Its behaviour must depend only on `key`. */
  fetchPage: (page: number) => Promise<{ items: T[]; total: number }>
  /** Optional identity used to drop duplicates when appending later pages. */
  dedupeKey?: (item: T) => string
}

export interface PagedQueryResult<T> {
  items: T[]
  total: number
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

export function usePagedQuery<T>({ key, fetchPage, dedupeKey }: PagedQueryOptions<T>): PagedQueryResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Set once a page returns nothing new — either the server is out of rows or
  // every row was a duplicate the caller's `dedupeKey` dropped. Without this a
  // deduplicated list would offer "Show more" forever, each press adding nothing.
  const [exhausted, setExhausted] = useState(false)

  // Latest callbacks, so the loaders below can stay referentially stable and
  // only re-run when `key` actually changes.
  const fetchRef = useRef(fetchPage)
  const dedupeRef = useRef(dedupeKey)
  const itemsRef = useRef<T[]>([])
  const pagesRef = useRef(0)
  const runRef = useRef(0)

  useEffect(() => {
    fetchRef.current = fetchPage
    dedupeRef.current = dedupeKey
  })

  const loadFirst = useCallback((targetKey: string, force: boolean) => {
    const run = ++runRef.current
    // A new query supersedes any in-flight "load more"; clear its flag here, or
    // the button would stay stuck on "Loading…" because the stale finally-guard
    // (run !== runRef.current) skips the reset.
    setLoadingMore(false)
    setExhausted(false)
    const cached = force ? null : readCache<T>(targetKey)
    if (cached) {
      pagesRef.current = cached.pages
      itemsRef.current = cached.items
      setItems(cached.items)
      setTotal(cached.total)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    fetchRef
      .current(0)
      .then((res) => {
        if (run !== runRef.current) return
        pagesRef.current = 1
        itemsRef.current = res.items
        setItems(res.items)
        setTotal(res.total)
        setLoading(false)
        writeCache(targetKey, { items: res.items, total: res.total, pages: 1, at: Date.now() })
      })
      .catch((err) => {
        if (run !== runRef.current) return
        setLoading(false)
        setError(messageFor(err))
      })
  }, [])

  useEffect(() => {
    if (!key) {
      runRef.current++
      pagesRef.current = 0
      itemsRef.current = []
      setItems([])
      setTotal(0)
      setLoading(false)
      setLoadingMore(false)
      setExhausted(false)
      setError(null)
      return
    }
    loadFirst(key, false)
  }, [key, loadFirst])

  const loadMore = useCallback(() => {
    if (!key || loadingMore) return
    const run = runRef.current
    const page = pagesRef.current
    setLoadingMore(true)
    fetchRef
      .current(page)
      .then((res) => {
        if (run !== runRef.current) return
        pagesRef.current = page + 1
        const before = itemsRef.current.length
        const next = appendUnique(itemsRef.current, res.items, dedupeRef.current)
        itemsRef.current = next
        setItems(next)
        setTotal(res.total)
        // Nothing new to show, so stop offering "Show more".
        if (next.length === before) setExhausted(true)
        writeCache(key, { items: next, total: res.total, pages: page + 1, at: Date.now() })
      })
      .catch((err) => {
        if (run === runRef.current) setError(messageFor(err))
      })
      .finally(() => {
        if (run === runRef.current) setLoadingMore(false)
      })
  }, [key, loadingMore])

  const refresh = useCallback(() => {
    if (key) loadFirst(key, true)
  }, [key, loadFirst])

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore: !exhausted && items.length < total,
    loadMore,
    refresh,
  }
}
