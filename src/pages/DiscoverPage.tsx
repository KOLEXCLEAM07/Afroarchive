import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Filter, X, SlidersHorizontal, TrendingUp,
  Clock, Star, Loader2, ChevronDown,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, debounce } from '@/lib/utils'
import ArticleCard from '@/components/articles/ArticleCard'
import type { Article, Category, SearchFilters } from '@/types'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First',    icon: <Clock className="w-4 h-4" /> },
  { value: 'most_liked', label: 'Most Liked',       icon: <Star className="w-4 h-4" /> },
  { value: 'most_viewed',label: 'Most Viewed',      icon: <TrendingUp className="w-4 h-4" /> },
]

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Egypt', 'Ethiopia', 'Kenya', 'South Africa',
  'Mali', 'Senegal', 'Zimbabwe', 'Morocco', 'Tanzania', 'Uganda',
]

const LANGUAGES = [
  'English', 'French', 'Arabic', 'Swahili', 'Amharic', 'Hausa',
  'Yoruba', 'Igbo', 'Portuguese', 'Spanish',
]

const TIME_PERIODS = [
  'Ancient (before 500 CE)', 'Medieval (500-1500 CE)',
  'Early Modern (1500-1800)', 'Colonial Era (1800-1960)',
  'Post-Independence (1960+)', 'Contemporary',
]

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [articles,    setArticles]    = useState<Article[]>([])
  const [categories,  setCategories]  = useState<Category[]>([])
  const [loading,     setLoading]     = useState(false)
  const [hasMore,     setHasMore]     = useState(false)
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<SearchFilters>({
    query:      searchParams.get('q')      || '',
    category:   searchParams.get('category') || '',
    country:    searchParams.get('country') || '',
    language:   searchParams.get('language') || '',
    timePeriod: searchParams.get('period') || '',
    sortBy:     (searchParams.get('sort') as SearchFilters['sortBy']) || 'newest',
  })

  const PAGE_SIZE = 12

  useEffect(() => { fetchCategories() }, [])

  const fetchArticles = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 1 : page

    let query = supabase
      .from('articles')
      .select('*, author:profiles!articles_author_id_fkey(*), category:categories(*)', { count: 'exact' })
      .eq('status', 'published')

    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,excerpt.ilike.%${filters.query}%`)
    }
    if (filters.category) {
      const cat = categories.find(c => c.slug === filters.category || c.id === filters.category)
      if (cat) query = query.eq('category_id', cat.id)
    }
    if (filters.country)    query = query.eq('country', filters.country)
    if (filters.language)   query = query.eq('language', filters.language)
    if (filters.timePeriod) query = query.eq('time_period', filters.timePeriod)

    switch (filters.sortBy) {
      case 'most_liked':  query = query.order('likes_count', { ascending: false }); break
      case 'most_viewed': query = query.order('views_count', { ascending: false }); break
      default:            query = query.order('published_at', { ascending: false }); break
    }

    const from = (currentPage - 1) * PAGE_SIZE
    query = query.range(from, from + PAGE_SIZE - 1)

    const { data, count } = await query
    const newArticles = (data as Article[]) ?? []

    if (reset) {
      setArticles(newArticles)
      setPage(2)
    } else {
      setArticles(prev => [...prev, ...newArticles])
      setPage(p => p + 1)
    }
    setTotal(count ?? 0)
    setHasMore(from + PAGE_SIZE < (count ?? 0))
    setLoading(false)
  }, [filters, categories, page])

  useEffect(() => {
    fetchArticles(true)
    // Update URL
    const params: Record<string, string> = {}
    if (filters.query)      params.q        = filters.query
    if (filters.category)   params.category = filters.category
    if (filters.country)    params.country  = filters.country
    if (filters.language)   params.language = filters.language
    if (filters.timePeriod) params.period   = filters.timePeriod
    if (filters.sortBy !== 'newest') params.sort = filters.sortBy ?? ''
    setSearchParams(params, { replace: true })
  }, [filters])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories((data as Category[]) ?? [])
  }

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(f => ({ ...f, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ query: '', category: '', country: '', language: '', timePeriod: '', sortBy: 'newest' })
  }

  const hasActiveFilters = !!(filters.category || filters.country || filters.language || filters.timePeriod)

  return (
    <div className="container-app py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-xl text-gray-900 dark:text-white mb-2">Explore Knowledge</h1>
        <p className="text-gray-500 dark:text-gray-400">Discover {total.toLocaleString()} articles on African history, culture, science, and philosophy</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            id="discover-search"
            type="text"
            value={filters.query}
            onChange={e => updateFilter('query', e.target.value)}
            placeholder="Search articles, topics, authors…"
            className="input-lg pl-12"
          />
          {filters.query && (
            <button onClick={() => updateFilter('query', '')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          id="discover-filter-btn"
          onClick={() => setShowFilters(f => !f)}
          className={cn('btn btn-md gap-2 border', hasActiveFilters ? 'btn-primary' : 'btn-ghost border-sand-300 dark:border-dark-border')}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && <span className="badge bg-white/20 text-white text-2xs">{[filters.category, filters.country, filters.language, filters.timePeriod].filter(Boolean).length}</span>}
        </button>
      </div>

      {/* Sort + Results */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? 'Searching…' : `${total.toLocaleString()} results`}
          {filters.query && <span className="font-medium text-gray-700 dark:text-gray-300"> for "{filters.query}"</span>}
        </p>
        <div className="flex gap-2">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('sortBy', opt.value)}
              className={cn(
                'btn btn-sm gap-1.5',
                filters.sortBy === opt.value ? 'btn-primary' : 'btn-ghost border border-sand-200 dark:border-dark-border',
              )}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0">
            <div className="card p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Clear all</button>
                )}
              </div>

              <FilterGroup label="Category">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <FilterChip label="All" active={!filters.category} onClick={() => updateFilter('category', '')} />
                  {categories.map(c => (
                    <FilterChip key={c.id} label={c.name} active={filters.category === c.slug} onClick={() => updateFilter('category', filters.category === c.slug ? '' : c.slug)} />
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Country">
                <select value={filters.country} onChange={e => updateFilter('country', e.target.value)} className="input text-sm">
                  <option value="">All countries</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FilterGroup>

              <FilterGroup label="Language">
                <select value={filters.language} onChange={e => updateFilter('language', e.target.value)} className="input text-sm">
                  <option value="">All languages</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </FilterGroup>

              <FilterGroup label="Time Period" last>
                <div className="space-y-1">
                  <FilterChip label="All" active={!filters.timePeriod} onClick={() => updateFilter('timePeriod', '')} />
                  {TIME_PERIODS.map(p => (
                    <FilterChip key={p} label={p} active={filters.timePeriod === p} onClick={() => updateFilter('timePeriod', filters.timePeriod === p ? '' : p)} small />
                  ))}
                </div>
              </FilterGroup>
            </div>
          </aside>
        )}

        {/* Articles Grid */}
        <div className="flex-1 min-w-0">
          {loading && articles.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="heading-sm text-gray-700 dark:text-gray-300 mb-2">No articles found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Try different search terms or clear your filters</p>
              <button onClick={clearFilters} className="btn btn-primary btn-md">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(article => (
                  <ArticleCard key={article.id} article={article} variant="default" />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => fetchArticles(false)}
                    disabled={loading}
                    className="btn btn-outline btn-lg gap-2"
                    id="discover-load-more-btn"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronDown className="w-5 h-5" />}
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn('mb-4', !last && 'pb-4 border-b border-sand-200 dark:border-dark-border')}>
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</h4>
      {children}
    </div>
  )
}

function FilterChip({ label, active, onClick, small }: { label: string; active: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg px-3 py-1.5 transition-all',
        small ? 'text-xs' : 'text-sm',
        active
          ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-medium'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-surface',
      )}
    >
      {label}
    </button>
  )
}

function ArticleSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-40 rounded-xl" />
      <div className="skeleton h-4 w-20 rounded" />
      <div className="skeleton h-5 rounded" />
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-3 rounded" />
    </div>
  )
}
