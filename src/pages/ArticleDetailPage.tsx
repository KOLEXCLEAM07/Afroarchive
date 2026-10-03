import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import {
  ArrowLeft, Clock, Calendar, MapPin, Eye, Heart,
  Bookmark, Share2, BookOpen, User, Check, Sparkles,
  ExternalLink, Quote, Tag, ShieldCheck, ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useBookmarks } from '@/hooks/useBookmarks'
import { cn, formatDate, formatNumber, getAvatarFallback, getAvatarColor } from '@/lib/utils'
import { FOUNDATIONAL_ARTICLES } from '@/data/articlesData'
import ArticleCard from '@/components/articles/ArticleCard'
import type { Article } from '@/types'
import toast from 'react-hot-toast'

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmarks()

  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasLiked, setHasLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [scrollProgress, setScrollProgress] = useState(0)

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    async function loadArticle() {
      if (!slug) return
      setLoading(true)

      try {
        // First check Supabase
        const { data, error } = await supabase
          .from('articles')
          .select('*, author:profiles!articles_author_id_fkey(*), category:categories(*)')
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .single()

        if (!error && data) {
          const loaded = data as Article
          setArticle(loaded)
          setLikesCount(loaded.likes_count || 0)
        } else {
          // Fallback to foundational repository
          const fallback = FOUNDATIONAL_ARTICLES.find(
            a => a.slug === slug || a.id === slug
          )
          if (fallback) {
            setArticle(fallback)
            setLikesCount(fallback.likes_count || 0)
          } else {
            setArticle(null)
          }
        }
      } catch {
        const fallback = FOUNDATIONAL_ARTICLES.find(
          a => a.slug === slug || a.id === slug
        )
        if (fallback) {
          setArticle(fallback)
          setLikesCount(fallback.likes_count || 0)
        }
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug])

  const handleLike = () => {
    if (hasLiked) {
      setHasLiked(false)
      setLikesCount(c => Math.max(0, c - 1))
      toast('Like removed', { icon: '🤍' })
    } else {
      setHasLiked(true)
      setLikesCount(c => c + 1)
      toast.success('Added to your scholarly favorites!')
    }
  }

  const handleBookmark = () => {
    if (!article) return
    toggleBookmark({
      id: article.id,
      type: 'article',
      title: article.title,
      subtitle: article.excerpt || undefined,
      catalogOrCategory: article.category?.name || 'Heritage',
      savedAt: new Date().toISOString(),
    })
    if (!isBookmarked(article.id)) {
      toast.success('Archived to your Saved Heritage collection!')
    } else {
      toast('Removed from Saved Heritage', { icon: '🔖' })
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Article link copied to clipboard!')
  }

  const relatedArticles = FOUNDATIONAL_ARTICLES.filter(
    a => a.slug !== slug && (a.category_id === article?.category_id || a.category?.slug === article?.category?.slug)
  ).slice(0, 3)

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-500/20 border-t-primary-600 animate-spin" />
          <p className="font-serif italic text-gray-500 dark:text-gray-400">Opening archival manuscript...</p>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-sand-50 dark:bg-dark-bg py-20">
        <div className="container-app text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sand-200 dark:bg-dark-card flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="heading-lg text-gray-900 dark:text-white mb-3">Manuscript Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The article or manuscript you are searching for does not exist or has been relocated to another archival collection.
          </p>
          <Link to="/discover" className="btn btn-primary btn-md gap-2">
            <ArrowLeft className="w-4 h-4" /> Explore Archival Catalog
          </Link>
        </div>
      </div>
    )
  }

  const isSaved = isBookmarked(article.id)

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors pb-24">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-amber-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation Breadcrumb Bar */}
      <div className="border-b border-sand-200 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md sticky top-16 z-30 transition-colors">
        <div className="container-app py-3 flex items-center justify-between gap-4">
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Catalog</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate max-w-[200px] sm:max-w-xs">{article.category?.name || 'Archive'}</span>
          </Link>

          {/* Quick Reader Controls */}
          <div className="flex items-center gap-2">
            {/* Font size toggle */}
            <div className="hidden sm:flex items-center bg-sand-100 dark:bg-dark-card rounded-lg p-0.5 border border-sand-200 dark:border-dark-border text-xs">
              <button
                onClick={() => setFontSize('normal')}
                className={cn('px-2.5 py-1 rounded font-medium', fontSize === 'normal' ? 'bg-white dark:bg-dark-surface shadow-xs text-primary-600 dark:text-primary-400' : 'text-gray-500')}
                title="Default Text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={cn('px-2.5 py-1 rounded font-medium text-sm', fontSize === 'large' ? 'bg-white dark:bg-dark-surface shadow-xs text-primary-600 dark:text-primary-400' : 'text-gray-500')}
                title="Larger Text"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={cn('px-2.5 py-1 rounded font-bold text-base', fontSize === 'xlarge' ? 'bg-white dark:bg-dark-surface shadow-xs text-primary-600 dark:text-primary-400' : 'text-gray-500')}
                title="Editorial Display Text"
              >
                A++
              </button>
            </div>

            <button
              onClick={handleBookmark}
              className={cn(
                'btn btn-sm gap-1.5 border',
                isSaved
                  ? 'btn-primary'
                  : 'btn-ghost border-sand-200 dark:border-dark-border text-gray-600 dark:text-gray-300'
              )}
              title={isSaved ? 'Saved in Heritage' : 'Save Article'}
            >
              <Bookmark className={cn('w-3.5 h-3.5', isSaved && 'fill-current')} />
              <span className="hidden sm:inline">{isSaved ? 'Archived' : 'Bookmark'}</span>
            </button>

            <button
              onClick={handleShare}
              className="btn btn-ghost btn-sm border border-sand-200 dark:border-dark-border text-gray-600 dark:text-gray-300"
              title="Share Article Link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <article className="container-app pt-10">
        {/* Article Header */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-3xl mx-auto mb-10 text-center sm:text-left"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {article.category && (
              <span className="badge badge-primary font-mono text-2xs tracking-widest uppercase">
                {article.category.name}
              </span>
            )}
            {article.time_period && (
              <span className="badge badge-gray font-mono text-2xs">
                {article.time_period}
              </span>
            )}
            {article.country && (
              <span className="inline-flex items-center gap-1 text-2xs text-gray-500 dark:text-gray-400 font-mono">
                <MapPin className="w-3 h-3 text-primary-500" />
                {article.country}
              </span>
            )}
          </div>

          <h1 className="heading-xl text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white leading-[1.15] mb-6">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="font-serif italic text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
              "{article.excerpt}"
            </p>
          )}

          {/* Author & Attribution Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <Link to={article.author?.username ? `/profile/${article.author.username}` : '#'}>
                {article.author?.avatar_url ? (
                  <img
                    src={article.author.avatar_url}
                    alt={article.author.full_name || 'Author'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-500/40"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-serif font-bold text-lg">
                    {getAvatarFallback(article.author?.full_name || article.author?.username || 'AfroArchive')}
                  </div>
                )}
              </Link>
              <div>
                <div className="flex items-center gap-1.5">
                  <Link
                    to={article.author?.username ? `/profile/${article.author.username}` : '#'}
                    className="font-serif font-bold text-base text-gray-900 dark:text-white hover:text-primary-600 transition-colors"
                  >
                    {article.author?.full_name || article.author?.username || 'AfroArchive Scholar'}
                  </Link>
                  {article.author?.is_verified && (
                    <span title="Verified Scholar">
                      <ShieldCheck className="w-4 h-4 text-primary-500" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {article.author?.bio || 'AfroArchive Fellow in African Civilizations'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent-500" />
                <span>{article.reading_time} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary-500" />
                <span>{formatDate(article.published_at || new Date().toISOString())}</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Featured Image */}
        {article.cover_image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="relative rounded-3xl overflow-hidden border border-sand-200 dark:border-dark-border shadow-museum aspect-[16/9] sm:aspect-[21/9]">
              <img
                src={article.cover_image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-6 text-2xs font-mono text-white/80 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                ARCHIVE DOCUMENTATION: {article.country?.toUpperCase() || 'CONTINENTAL'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Article Body */}
        <div className="max-w-3xl mx-auto">
          {/* Action Ribbon */}
          <div className="flex items-center justify-between py-4 border-y border-sand-200 dark:border-dark-border mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-xl border',
                  hasLiked
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900/50'
                    : 'hover:bg-sand-100 dark:hover:bg-dark-card border-transparent text-gray-600 dark:text-gray-400'
                )}
              >
                <Heart className={cn('w-4 h-4', hasLiked && 'fill-current text-rose-500')} />
                <span>{formatNumber(likesCount)}</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                <Eye className="w-4 h-4 text-gray-400" />
                <span>{formatNumber(article.views_count)} views</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                className={cn(
                  'p-2 rounded-xl border transition-colors',
                  isSaved
                    ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 border-primary-200'
                    : 'hover:bg-sand-100 dark:hover:bg-dark-card border-sand-200 dark:border-dark-border text-gray-500'
                )}
                title="Save"
              >
                <Bookmark className={cn('w-4 h-4', isSaved && 'fill-current')} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-xl border border-sand-200 dark:border-dark-border text-gray-500 hover:bg-sand-100 dark:hover:bg-dark-card transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Render Article Prose */}
          <div
            className={cn(
              'prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans',
              fontSize === 'normal' && 'text-base sm:text-lg',
              fontSize === 'large'  && 'text-lg sm:text-xl leading-loose',
              fontSize === 'xlarge' && 'text-xl sm:text-2xl leading-loose font-serif'
            )}
          >
            {article.content.split('\n\n').map((block, idx) => {
              // Markdown blockquote
              if (block.startsWith('>')) {
                const quoteText = block.replace(/^>\s*/gm, '')
                return (
                  <blockquote
                    key={idx}
                    className="relative my-8 pl-6 pr-4 py-4 border-l-4 border-primary-500 bg-sand-100/70 dark:bg-dark-card/60 rounded-r-2xl italic font-serif text-lg text-gray-900 dark:text-gray-100"
                  >
                    <Quote className="w-6 h-6 text-primary-500/40 absolute -top-2 left-2 pointer-events-none" />
                    {quoteText}
                  </blockquote>
                )
              }

              // Markdown H3
              if (block.startsWith('### ')) {
                return (
                  <h3
                    key={idx}
                    className="heading-md text-2xl text-gray-900 dark:text-white mt-10 mb-4 pt-4 border-t border-sand-200 dark:border-dark-border"
                  >
                    {block.replace('### ', '')}
                  </h3>
                )
              }

              // Markdown H2
              if (block.startsWith('## ')) {
                return (
                  <h2
                    key={idx}
                    className="heading-lg text-3xl text-gray-900 dark:text-white mt-12 mb-4"
                  >
                    {block.replace('## ', '')}
                  </h2>
                )
              }

              // Markdown List
              if (block.startsWith('1. ') || block.startsWith('- ')) {
                const lines = block.split('\n')
                return (
                  <ul key={idx} className="my-6 space-y-2 list-disc list-inside">
                    {lines.map((li, lIdx) => (
                      <li key={lIdx} className="leading-relaxed">
                        {li.replace(/^[0-9]+\.\s*|-\s*/, '')}
                      </li>
                    ))}
                  </ul>
                )
              }

              // Normal paragraph with dropcap on first paragraph
              return (
                <p key={idx} className="my-5 leading-relaxed font-sans">
                  {idx === 0 ? (
                    <span className="float-left text-5xl leading-[0.8] font-serif font-bold text-primary-600 dark:text-primary-400 mr-3 mt-1">
                      {block.charAt(0)}
                    </span>
                  ) : null}
                  {idx === 0 ? block.slice(1) : block}
                </p>
              )
            })}
          </div>

          {/* References & Citations */}
          {article.references && article.references.length > 0 && (
            <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary-500" />
                <h4 className="font-serif font-bold text-lg text-gray-900 dark:text-white">
                  Archival Citations & Scholarly References
                </h4>
              </div>
              <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-400">
                {article.references.map((ref, i) => (
                  <li key={i} className="pl-1 leading-relaxed">
                    {ref}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Author Biography Footer */}
          <div className="mt-10 p-6 rounded-3xl bg-gradient-to-br from-sand-100 to-sand-50 dark:from-dark-card dark:to-dark-surface border border-sand-200 dark:border-dark-border flex flex-col sm:flex-row items-center gap-6">
            <Link to={article.author?.username ? `/profile/${article.author.username}` : '#'}>
              {article.author?.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt={article.author.full_name || 'Author'}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-500"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-serif font-bold text-2xl">
                  {getAvatarFallback(article.author?.full_name || article.author?.username || 'AfroArchive')}
                </div>
              )}
            </Link>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">
                  {article.author?.full_name || article.author?.username}
                </h3>
                {article.author?.is_verified && (
                  <ShieldCheck className="w-4 h-4 text-primary-500" />
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                {article.author?.bio || 'Contributing curator and scholar for AfroArchive open-access knowledge initiative.'}
              </p>
              <Link
                to={article.author?.username ? `/profile/${article.author.username}` : '/profile'}
                className="btn btn-outline btn-sm gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>View Archival Profile & Publications</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Archival Works */}
        {relatedArticles.length > 0 && (
          <div className="max-w-5xl mx-auto mt-20 pt-12 border-t border-sand-200 dark:border-dark-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="badge badge-primary font-mono text-2xs mb-2">CONTINUE EXPLORING</span>
                <h3 className="heading-lg text-2xl sm:text-3xl text-gray-900 dark:text-white">
                  Related Archival Manuscripts
                </h3>
              </div>
              <Link to="/discover" className="btn btn-ghost btn-sm gap-1 text-primary-600 dark:text-primary-400">
                <span>View Full Catalog</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map(rel => (
                <ArticleCard key={rel.id} article={rel} variant="default" />
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
