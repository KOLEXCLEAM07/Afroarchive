import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { Search, X, SlidersHorizontal, TrendingUp, Clock, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ilikeAny } from '@/lib/query'
import { fetchKnowledgePage, queryKey } from '@/lib/knowledgeQuery'
import { usePagedQuery } from '@/hooks/usePagedQuery'
import { knowledgeItemToArticle, type KnowledgeRecord } from '@/lib/knowledge'
import { ARTICLE_LANGUAGES } from '@/lib/languages'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import ArticleCard from '@/components/articles/ArticleCard'
import { FOUNDATIONAL_ARTICLES } from '@/data/articlesData'
import type { Article, Category } from '@/types'

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }

type SortKey = 'newest' | 'most_liked' | 'most_viewed'
type Kind = 'all' | 'articles' | 'records'

const SORT_OPTIONS: Array<{ value: SortKey; label: string; icon: JSX.Element }> = [
  { value: 'newest',      label: 'Newest',      icon: <Clock className="w-3.5 h-3.5" /> },
  { value: 'most_liked',  label: 'Most liked',  icon: <Star className="w-3.5 h-3.5" /> },
  { value: 'most_viewed', label: 'Most viewed', icon: <TrendingUp className="w-3.5 h-3.5" /> },
]

const KINDS: Array<{ value: Kind; label: string }> = [
  { value: 'all', label: 'Everything' },
  { value: 'articles', label: 'Articles' },
  { value: 'records', label: 'Archive records' },
]

// Used until the categories table has loaded (slugs match the database).
const FALLBACK_CATEGORIES = [
  { slug: 'history', name: 'History & Civilizations' },
  { slug: 'philosophy', name: 'Philosophy & Thought' },
  { slug: 'science', name: 'Science & Innovation' },
  { slug: 'languages', name: 'Languages & Scripts' },
  { slug: 'art-culture', name: 'Art & Culture' },
  { slug: 'research', name: 'Scholarly Research' },
]

const RECORD_PAGE = 24

const RECORD_TYPES: Array<{ value: string; label: string; types: string[] }> = [
  { value: '',        label: 'All records',       types: [] },
  { value: 'objects', label: 'Objects',           types: ['cultural_artifact', 'manuscript'] },
  { value: 'places',  label: 'Places',            types: ['place'] },
  { value: 'people',  label: 'People',            types: ['person'] },
  { value: 'states',  label: 'States & kingdoms', types: ['kingdom_or_state'] },
  { value: 'works',   label: 'Scholarly works',   types: ['work'] },
]

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Egypt', 'Ethiopia', 'Kenya', 'South Africa',
  'Mali', 'Senegal', 'Zimbabwe', 'Morocco', 'Tanzania', 'Uganda',
]

function sortArticles(list: Article[], sort: SortKey) {
  const copy = [...list]
  if (sort === 'most_liked') copy.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
  else if (sort === 'most_viewed') copy.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
  else copy.sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''))
  return copy
}

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query    = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const country  = searchParams.get('country') || ''
  const sort     = (searchParams.get('sort') as SortKey) || 'newest'
  const kind     = (searchParams.get('type') as Kind) || 'all'
  const language = searchParams.get('lang') || ''
  const recordType = searchParams.get('rt') || ''

  const [queryInput, setQueryInput] = useState(query)
  const [categories, setCategories] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [articleTotal, setArticleTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useDocumentTitle('Discover')

  const updateParam = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  /** Applies several filter changes at once (e.g. switching content kind). */
  const applyFilters = (mutate: (params: URLSearchParams) => void) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      mutate(next)
      return next
    }, { replace: true })
  }

  useEffect(() => {
    let cancelled = false
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => { if (!cancelled && data?.length) setCategories(data as Category[]) })
    return () => { cancelled = true }
  }, [])

  // Keep the input in sync when the URL changes elsewhere (e.g. navbar search).
  useEffect(() => { setQueryInput(query) }, [query])

  // Debounce typing into the URL so we don't query on every keystroke.
  useEffect(() => {
    if (queryInput.trim() === query) return
    const t = setTimeout(() => updateParam('q', queryInput.trim()), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput])

  const categoryOptions = useMemo(
    () => (categories.length ? categories.map(c => ({ slug: c.slug, name: c.name })) : FALLBACK_CATEGORIES),
    [categories]
  )
  const activeCategory = categories.find(c => c.slug === category)
  const categoryLabel = categoryOptions.find(c => c.slug === category)?.name || category

  const showRecords = kind !== 'articles' && !country && !language && (kind === 'records' || !category)

  const fetchRecordPage = useCallback(
    async (page: number) => {
      const typeDef = RECORD_TYPES.find(t => t.value === recordType)
      const { rows, total } = await fetchKnowledgePage<KnowledgeRecord>({
        page,
        pageSize: RECORD_PAGE,
        types: typeDef?.types.length ? typeDef.types : undefined,
        // Scholarly papers are a niche; keep them out of the default view unless asked for.
        excludeTypes: typeDef?.types.length ? undefined : ['work'],
        search: query,
        searchColumns: ['title', 'summary'],
      })
      return { items: rows.map(knowledgeItemToArticle), total }
    },
    [query, recordType]
  )

  // Records are hidden entirely while the article-only filters are on.
  const recordsKey = useMemo(
    () => (showRecords ? queryKey('discover-records', { q: query.trim(), rt: recordType }) : null),
    [showRecords, query, recordType]
  )

  const {
    items: records,
    total: recordTotal,
    loading: recordsLoading,
    loadingMore,
    error: recordsError,
    loadMore: loadMoreRecords,
  } = usePagedQuery<Article>({ key: recordsKey, fetchPage: fetchRecordPage })

  // Community articles and bundled editorial essays
  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setLoadError(false)
      const q = query.trim()

      let dbArticles: Article[] = []
      let dbArticleTotal = 0
      const categoryUnknown = !!category && categories.length > 0 && !activeCategory
      if (kind !== 'records' && !categoryUnknown) {
        let req = supabase
          .from('articles')
          .select('*, author:profiles!articles_author_id_fkey(*), category:categories(*)', { count: 'exact' })
          .eq('status', 'published')
          .limit(60)
        if (q) req = req.or(ilikeAny(['title', 'excerpt'], q))
        if (activeCategory) req = req.eq('category_id', activeCategory.id)
        if (country) req = req.eq('country', country)
        if (language) req = req.eq('language', language)
        req = sort === 'most_liked' ? req.order('likes_count', { ascending: false })
          : sort === 'most_viewed' ? req.order('views_count', { ascending: false })
          : req.order('published_at', { ascending: false })
        const { data, error, count } = await req
        if (error) setLoadError(true)
        dbArticles = (data as Article[]) ?? []
        dbArticleTotal = count ?? dbArticles.length
      }

      const editorial = kind === 'records' ? [] : FOUNDATIONAL_ARTICLES.filter(a => {
        if (q) {
          const needle = q.toLowerCase()
          if (!a.title.toLowerCase().includes(needle) && !a.excerpt?.toLowerCase().includes(needle) && !a.content.toLowerCase().includes(needle)) return false
        }
        if (category && a.category?.slug !== category) return false
        if (country && a.country?.toLowerCase() !== country.toLowerCase()) return false
        if (language && a.language !== language) return false
        return true
      })

      if (cancelled) return
      setArticles(sortArticles([...dbArticles, ...editorial], sort).filter(a => a.title?.trim().length >= 5))
      setArticleTotal(kind === 'records' ? 0 : dbArticleTotal + editorial.length)
      setLoading(false)
    }
    run().catch(() => { if (!cancelled) { setLoadError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [query, category, country, language, sort, kind, categories, activeCategory])

  // Imported archive records are fetched by usePagedQuery above.

  const items = useMemo(() => {
    // Skip duplicate imports of the same image.
    const seen = new Set<string>()
    return [...articles, ...records].filter(a => {
      const keys = [a.slug, a.is_record && a.cover_image ? a.cover_image : null].filter(Boolean) as string[]
      if (keys.some(k => seen.has(k))) return false
      keys.forEach(k => seen.add(k))
      return true
    })
  }, [articles, records])
  const totalResults = articleTotal + (showRecords ? recordTotal : 0)
  const hasMoreRecords = showRecords && records.length < recordTotal
  // Wait for both the article and the record queries, so records arriving a beat
  // later no longer flash the "Nothing found" state.
  const busy = loading || recordsLoading
  const showLoadError = (loadError || !!recordsError) && !busy

  const clearFilters = () => {
    setQueryInput('')
    setSearchParams({}, { replace: true })
  }

  const activeFilterCount = [category, country, language].filter(Boolean).length

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors py-10">
      <div className="container-app">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <h1 className="heading-xl text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-3">
            {activeCategory?.name || (category ? categoryLabel : 'Explore African Knowledge')}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            {activeCategory?.description || 'Essays by contributors, editorial introductions and records gathered from open archives, all in one place.'}
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <label htmlFor="discover-search" className="sr-only">Search the archive</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              id="discover-search"
              type="search"
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              placeholder="Search people, places, kingdoms, ideas…"
              className="input-lg pl-12 bg-white dark:bg-dark-surface shadow-xs border-sand-300 dark:border-dark-border"
            />
            {queryInput && (
              <button type="button" onClick={() => { setQueryInput(''); updateParam('q', '') }} aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(f => !f)}
            aria-expanded={showFilters}
            className={cn(
              'btn btn-lg gap-2 border transition-all flex-shrink-0',
              showFilters || activeFilterCount
                ? 'btn-primary'
                : 'btn-ghost border-sand-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="badge bg-white/20 text-white text-2xs ml-1">{activeFilterCount}</span>}
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6" role="group" aria-label="Category">
          {[{ slug: '', name: 'All topics' }, ...categoryOptions].map(cat => {
            const isActive = category === cat.slug
            return (
              <button
                key={cat.slug || 'all'}
                type="button"
                aria-pressed={isActive}
                onClick={() => applyFilters(n => {
                  if (cat.slug) n.set('category', cat.slug)
                  else n.delete('category')
                  // A topic implies essays, so leave "Archive records" mode.
                  if (kind === 'records') n.delete('type')
                })}
                className={cn(
                  'whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all border flex-shrink-0',
                  isActive
                    ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                    : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 border-sand-200 dark:border-dark-border hover:border-primary-400'
                )}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-sand-200 dark:border-dark-border mb-6 text-sm">
          <p className="text-gray-500 dark:text-gray-400" aria-live="polite">
            {busy ? 'Searching…' : `${totalResults.toLocaleString()} result${totalResults === 1 ? '' : 's'}`}
            {query && !busy && <span className="font-medium text-gray-800 dark:text-gray-200"> for “{query}”</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1" role="group" aria-label="Content type">
              {KINDS.map(k => (
                <button key={k.value} type="button" aria-pressed={kind === k.value}
                  onClick={() => {
                    if (k.value === 'records') {
                      // Records are not classified by topic, so drop the article-only
                      // filters: otherwise the list comes back empty while the badges
                      // still claim a topic is applied.
                      applyFilters(n => { n.set('type', 'records'); n.delete('category'); n.delete('country'); n.delete('lang') })
                    } else {
                      updateParam('type', k.value === 'all' ? '' : k.value)
                    }
                  }}
                  className={cn('btn btn-sm', kind === k.value ? 'btn-primary' : 'btn-ghost border border-sand-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300')}>
                  {k.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1" role="group" aria-label="Sort">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} type="button" aria-pressed={sort === opt.value}
                  onClick={() => updateParam('sort', opt.value === 'newest' ? '' : opt.value)}
                  className={cn('btn btn-sm gap-1.5', sort === opt.value ? 'btn-primary' : 'btn-ghost border border-sand-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300')}>
                  {opt.icon}<span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {showRecords && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4" role="group" aria-label="Record type">
            {RECORD_TYPES.map(t => (
              <button key={t.value || 'all'} type="button" aria-pressed={recordType === t.value}
                onClick={() => updateParam('rt', t.value)}
                className={cn('whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  recordType === t.value
                    ? 'bg-accent-400/15 text-accent-700 border-accent-400/50 dark:text-accent-300'
                    : 'text-gray-600 dark:text-gray-300 border-sand-200 dark:border-dark-border hover:border-primary-400')}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {category && (
              <span className="badge badge-primary gap-1 py-1">
                {categoryLabel}
                <button type="button" onClick={() => updateParam('category', '')} aria-label="Remove category filter" className="ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {language && (
              <span className="badge badge-secondary gap-1 py-1">
                {ARTICLE_LANGUAGES.find(l => l.code === language)?.name ?? language}
                <button type="button" onClick={() => updateParam('lang', '')} aria-label="Remove language filter" className="ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {country && (
              <span className="badge badge-secondary gap-1 py-1">
                {country}
                <button type="button" onClick={() => updateParam('country', '')} aria-label="Remove country filter" className="ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button type="button" onClick={clearFilters} className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium ml-2">Clear all</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {showFilters && (
            <aside className="w-full lg:w-72 flex-shrink-0">
              <div className="card p-6 sticky top-24 space-y-6">
                <h2 className="font-serif font-bold text-lg text-gray-900 dark:text-white pb-3 border-b border-sand-200 dark:border-dark-border">Filter</h2>
                <div>
                  <label htmlFor="discover-country" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Country</label>
                  <select id="discover-country" value={country} onChange={e => updateParam('country', e.target.value)} className="input text-sm bg-white dark:bg-dark-surface">
                    <option value="">All countries</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="discover-language" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Written in</label>
                  <select id="discover-language" value={language} onChange={e => updateParam('lang', e.target.value)} className="input text-sm bg-white dark:bg-dark-surface">
                    <option value="">Any language</option>
                    {ARTICLE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                </div>
                <p className="text-xs text-gray-400">Country and language filters apply to articles. Archive records are hidden while they are on.</p>
              </div>
            </aside>
          )}

          <div className="flex-1 min-w-0">
            {showLoadError && (
              <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">Some results could not be loaded. Showing what is available.</p>
            )}
            {busy ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-5 space-y-4 animate-pulse">
                    <div className="h-44 bg-sand-200 dark:bg-dark-card rounded-2xl" />
                    <div className="h-4 bg-sand-200 dark:bg-dark-card rounded w-1/3" />
                    <div className="h-6 bg-sand-200 dark:bg-dark-card rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 card p-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="heading-md text-gray-800 dark:text-gray-200 mb-2">Nothing found</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 text-sm">
                  Try a different spelling, a broader term, or clear the filters.
                </p>
                <button type="button" onClick={clearFilters} className="btn btn-primary btn-md">Clear search and filters</button>
              </div>
            ) : (
              <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(article => (
                  <motion.div key={article.id} variants={fadeUp}>
                    <ArticleCard article={article} variant="default" className="h-full" />
                  </motion.div>
                ))}
              </motion.div>
            )}
            {!busy && hasMoreRecords && (
              <div className="mt-10 text-center">
                <button type="button" onClick={loadMoreRecords} disabled={loadingMore} className="btn btn-outline btn-md gap-2">
                  {loadingMore ? 'Loading…' : `Show more (${(recordTotal - records.length).toLocaleString()} remaining)`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
