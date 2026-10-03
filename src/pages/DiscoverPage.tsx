import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import {
  Search, Filter, X, SlidersHorizontal, TrendingUp,
  Clock, Star, Loader2, ChevronDown, BookOpen, Sparkles,
  MapPin, Globe2, Compass, Layers
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import ArticleCard from '@/components/articles/ArticleCard'
import { FOUNDATIONAL_ARTICLES } from '@/data/articlesData'
import type { Article, Category, SearchFilters } from '@/types'

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First',    icon: <Clock className="w-3.5 h-3.5" /> },
  { value: 'most_liked', label: 'Most Liked',       icon: <Star className="w-3.5 h-3.5" /> },
  { value: 'most_viewed',label: 'Most Viewed',      icon: <TrendingUp className="w-3.5 h-3.5" /> },
]

const QUICK_CATEGORIES = [
  { label: 'All Catalog', slug: '' },
  { label: 'Philosophy', slug: 'philosophy' },
  { label: 'History & Kingdoms', slug: 'history' },
  { label: 'Indigenous Science', slug: 'science' },
  { label: 'Classical Arts', slug: 'arts' },
  { label: 'Architecture', slug: 'architecture' },
  { label: 'Oral Traditions', slug: 'languages' },
]

const COUNTRIES = [
  'All countries', 'Nigeria', 'Ghana', 'Egypt', 'Ethiopia', 'Kenya', 'South Africa',
  'Mali', 'Senegal', 'Zimbabwe', 'Morocco', 'Tanzania', 'Uganda',
]

const LANGUAGES = [
  'All languages', 'English', 'French', 'Arabic', 'Swahili', 'Amharic', 'Hausa',
  'Yoruba', 'Igbo', 'Portuguese',
]

const TIME_PERIODS = [
  'All periods',
  'Ancient (before 500 CE)',
  'Medieval (500–1500 CE)',
  'Early Modern (1500–1800)',
  'Colonial Era (1800–1960)',
  'Post-Independence (1960+)',
  'Contemporary',
]

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<SearchFilters>({
    query:      searchParams.get('q') || '',
    category:   searchParams.get('category') || '',
    country:    searchParams.get('country') || '',
    language:   searchParams.get('language') || '',
    timePeriod: searchParams.get('period') || '',
    sortBy:     (searchParams.get('sort') as SearchFilters['sortBy']) || 'newest',
  })

  // Load categories from Supabase (or fallback default categories)
  useEffect(() => {
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCategories(data as Category[])
        }
      })
  }, [])

  // Sync state when URL query params change (e.g., from collections click)
  useEffect(() => {
    const urlCategory = searchParams.get('category') || ''
    const urlQuery = searchParams.get('q') || ''
    setFilters(f => ({
      ...f,
      category: urlCategory,
      query: urlQuery || f.query,
    }))
  }, [searchParams])

  // Fetch articles combining Supabase and Foundational Archives
  const fetchArticles = useCallback(async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('articles')
        .select('*, author:profiles!articles_author_id_fkey(*), category:categories(*)', { count: 'exact' })
        .eq('status', 'published')

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,excerpt.ilike.%${filters.query}%`)
      }
      if (filters.category) {
        query = query.or(`category_id.eq.${filters.category},category_id.ilike.%${filters.category}%`)
      }
      if (filters.country && filters.country !== 'All countries') {
        query = query.eq('country', filters.country)
      }

      switch (filters.sortBy) {
        case 'most_liked':  query = query.order('likes_count', { ascending: false }); break
        case 'most_viewed': query = query.order('views_count', { ascending: false }); break
        default:            query = query.order('published_at', { ascending: false }); break
      }

      const { data, error } = await query
      const dbArticles = (!error && data) ? (data as Article[]) : []

      // Filter foundational articles locally based on active filters
      let baseArticles = FOUNDATIONAL_ARTICLES.filter(art => {
        if (filters.query) {
          const q = filters.query.toLowerCase()
          const matchTitle = art.title.toLowerCase().includes(q)
          const matchExcerpt = art.excerpt?.toLowerCase().includes(q)
          const matchAuthor = art.author?.full_name?.toLowerCase().includes(q) || art.author?.username.toLowerCase().includes(q)
          if (!matchTitle && !matchExcerpt && !matchAuthor) return false
        }

        if (filters.category) {
          const cat = filters.category.toLowerCase()
          const matchCat = art.category_id?.toLowerCase() === cat ||
                           art.category?.slug.toLowerCase() === cat ||
                           art.category?.name.toLowerCase().includes(cat)
          if (!matchCat) return false
        }

        if (filters.country && filters.country !== 'All countries') {
          if (art.country?.toLowerCase() !== filters.country.toLowerCase()) return false
        }

        if (filters.timePeriod && filters.timePeriod !== 'All periods') {
          const p = filters.timePeriod.toLowerCase()
          if (!art.time_period?.toLowerCase().includes(p)) return false
        }

        return true
      })

      // Sort base articles
      if (filters.sortBy === 'most_liked') {
        baseArticles.sort((a, b) => b.likes_count - a.likes_count)
      } else if (filters.sortBy === 'most_viewed') {
        baseArticles.sort((a, b) => b.views_count - a.views_count)
      }

      // Merge and deduplicate by slug or id
      const seen = new Set<string>()
      const combined: Article[] = []

      for (const item of [...dbArticles, ...baseArticles]) {
        const key = item.slug || item.id
        if (!seen.has(key)) {
          seen.add(key)
          combined.push(item)
        }
      }

      setArticles(combined)
      setTotal(combined.length)
    } catch {
      // quiet fallback
      setArticles(FOUNDATIONAL_ARTICLES)
      setTotal(FOUNDATIONAL_ARTICLES.length)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchArticles()

    // Sync filters to URL
    const params: Record<string, string> = {}
    if (filters.query)      params.q        = filters.query
    if (filters.category)   params.category = filters.category
    if (filters.country && filters.country !== 'All countries')    params.country  = filters.country
    if (filters.language && filters.language !== 'All languages')   params.language = filters.language
    if (filters.timePeriod && filters.timePeriod !== 'All periods') params.period   = filters.timePeriod
    if (filters.sortBy !== 'newest') params.sort = filters.sortBy ?? ''
    setSearchParams(params, { replace: true })
  }, [filters, fetchArticles])

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(f => ({ ...f, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ query: '', category: '', country: '', language: '', timePeriod: '', sortBy: 'newest' })
  }

  const hasActiveFilters = Boolean(
    filters.category ||
    (filters.country && filters.country !== 'All countries') ||
    (filters.language && filters.language !== 'All languages') ||
    (filters.timePeriod && filters.timePeriod !== 'All periods')
  )

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors py-10">
      <div className="container-app">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-primary font-mono text-2xs tracking-widest uppercase">
              PAN-AFRICAN ARCHIVAL ENGINE
            </span>
            <span className="text-xs text-gray-400 font-mono">
              OPEN-ACCESS SCHOLARSHIP
            </span>
          </div>

          <h1 className="heading-xl text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-3">
            Explore African Knowledge
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Discover peer-reviewed scholarship, translations of ancient manuscripts, and historical essays spanning five millennia of African civilization.
          </p>
        </motion.div>

        {/* Search Bar & Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              id="discover-search"
              type="text"
              value={filters.query}
              onChange={e => updateFilter('query', e.target.value)}
              placeholder="Search manuscripts, philosophies, authors, empires..."
              className="input-lg pl-12 bg-white dark:bg-dark-surface shadow-xs border-sand-300 dark:border-dark-border"
            />
            {filters.query && (
              <button
                onClick={() => updateFilter('query', '')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            id="discover-filter-btn"
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              'btn btn-lg gap-2 border transition-all flex-shrink-0',
              showFilters || hasActiveFilters
                ? 'btn-primary'
                : 'btn-ghost border-sand-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="badge bg-white/20 text-white text-2xs ml-1">
                {[filters.category, filters.country, filters.language, filters.timePeriod].filter(v => v && !v.startsWith('All')).length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Category Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
          {QUICK_CATEGORIES.map(cat => {
            const isActive = filters.category === cat.slug
            return (
              <button
                key={cat.slug}
                onClick={() => updateFilter('category', cat.slug)}
                className={cn(
                  'whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all border flex-shrink-0',
                  isActive
                    ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                    : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 border-sand-200 dark:border-dark-border hover:border-primary-400'
                )}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Status Bar & Sort Selection */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-sand-200 dark:border-dark-border mb-6 text-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span>{loading ? 'Searching archives...' : `${total} manuscripts & articles documented`}</span>
            {filters.query && (
              <span className="font-medium text-gray-800 dark:text-gray-200">
                matching "{filters.query}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-gray-400 mr-1 hidden sm:inline">SORT:</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateFilter('sortBy', opt.value)}
                className={cn(
                  'btn btn-sm gap-1.5 transition-colors',
                  filters.sortBy === opt.value
                    ? 'btn-primary'
                    : 'btn-ghost border border-sand-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300'
                )}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-gray-400 font-mono">Active Filters:</span>
            {filters.category && (
              <span className="badge badge-primary gap-1 py-1">
                Category: {filters.category}
                <button onClick={() => updateFilter('category', '')} className="hover:text-white/80 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.country && filters.country !== 'All countries' && (
              <span className="badge badge-secondary gap-1 py-1">
                Country: {filters.country}
                <button onClick={() => updateFilter('country', '')} className="hover:text-white/80 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.timePeriod && filters.timePeriod !== 'All periods' && (
              <span className="badge badge-gray gap-1 py-1">
                Era: {filters.timePeriod}
                <button onClick={() => updateFilter('timePeriod', '')} className="hover:text-gray-600 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Content Layout with Optional Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Collapsible Filter Sidebar */}
          {showFilters && (
            <aside className="w-full lg:w-72 flex-shrink-0">
              <div className="card p-6 sticky top-24 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-sand-200 dark:border-dark-border">
                  <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">
                    Filter Archive
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Country Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-mono">
                    Country & Region
                  </label>
                  <select
                    value={filters.country}
                    onChange={e => updateFilter('country', e.target.value)}
                    className="input text-sm bg-white dark:bg-dark-surface"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-mono">
                    Manuscript Language
                  </label>
                  <select
                    value={filters.language}
                    onChange={e => updateFilter('language', e.target.value)}
                    className="input text-sm bg-white dark:bg-dark-surface"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Time Period Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-mono">
                    Historical Era
                  </label>
                  <div className="space-y-1.5">
                    {TIME_PERIODS.map(p => {
                      const isActive = (filters.timePeriod === p) || (!filters.timePeriod && p === 'All periods')
                      return (
                        <button
                          key={p}
                          onClick={() => updateFilter('timePeriod', p === 'All periods' ? '' : p)}
                          className={cn(
                            'w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 font-bold'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-sand-100 dark:hover:bg-dark-card'
                          )}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Articles Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-5 space-y-4 animate-pulse">
                    <div className="h-44 bg-sand-200 dark:bg-dark-card rounded-2xl" />
                    <div className="h-4 bg-sand-200 dark:bg-dark-card rounded w-1/3" />
                    <div className="h-6 bg-sand-200 dark:bg-dark-card rounded w-3/4" />
                    <div className="h-4 bg-sand-200 dark:bg-dark-card rounded w-full" />
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20 card p-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="heading-md text-gray-800 dark:text-gray-200 mb-2">
                  No Archival Articles Found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 text-sm">
                  We could not find any manuscripts matching your search terms or filter criteria. Try refining your keywords or clearing your active filters.
                </p>
                <button onClick={clearFilters} className="btn btn-primary btn-md">
                  Reset Catalog Filters
                </button>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {articles.map(article => (
                  <motion.div key={article.id} variants={fadeUp}>
                    <ArticleCard article={article} variant="default" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
