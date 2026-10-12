import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import {
  ArrowLeft, Clock, Calendar, MapPin, Eye, Heart,
  Bookmark, Share2, BookOpen, User, ShieldCheck, ChevronRight,
  ExternalLink, Archive, Scale, EyeOff,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn, formatDate, formatNumber, getAvatarFallback, shareArticle } from '@/lib/utils'
import { isUuid } from '@/lib/query'
import { KNOWLEDGE_SELECT, knowledgeItemToArticle, licenseLabel, recordModel3d, type KnowledgeRecord } from '@/lib/knowledge'
import Model3DViewer from '@/components/museum/Model3DViewer'

function countryDisplay(value: string): string {
  if (!/^[A-Z]{2}$/.test(value)) return value
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(value) || value } catch { return value }
}
import { FOUNDATIONAL_ARTICLES } from '@/data/articlesData'
import ArticleCard from '@/components/articles/ArticleCard'
import ArticleBody from '@/components/articles/ArticleBody'
import AddToCollection from '@/components/articles/AddToCollection'
import CiteThis from '@/components/articles/CiteThis'
import RecordFacts from '@/components/articles/RecordFacts'
import ReportButton from '@/components/moderation/ReportButton'
import { isRtl, languageName } from '@/lib/languages'
import type { Article } from '@/types'
import toast from 'react-hot-toast'

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

type Origin = 'community' | 'editorial' | 'record'

interface Loaded {
  article: Article
  origin: Origin
  record?: KnowledgeRecord
}

const ARTICLE_SELECT = '*, author:profiles!articles_author_id_fkey(*), category:categories(*)'

async function loadBySlug(slug: string): Promise<Loaded | null> {
  const column = isUuid(slug) ? 'id' : 'slug'

  const { data: dbArticle } = await supabase
    .from('articles').select(ARTICLE_SELECT).eq(column, slug).maybeSingle()
  if (dbArticle) return { article: dbArticle as Article, origin: 'community' }

  const editorial = FOUNDATIONAL_ARTICLES.find(a => a.slug === slug || a.id === slug)
  if (editorial) return { article: editorial, origin: 'editorial' }

  const { data: record } = await supabase
    .from('knowledge_items').select(KNOWLEDGE_SELECT).eq(column, slug).maybeSingle()
  if (record) {
    const r = record as unknown as KnowledgeRecord
    if (r.verification_status === 'flagged') return null
    return { article: knowledgeItemToArticle(r), origin: 'record', record: r }
  }
  return null
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmarks()

  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasLiked, setHasLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [likeBusy, setLikeBusy] = useState(false)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [scrollProgress, setScrollProgress] = useState(0)

  const article = loaded?.article ?? null
  const origin = loaded?.origin
  const isAuthor = !!user && article?.author_id === user.id
  // RLS should already hide other people's drafts; this is a second line of defence.
  const visible = article && (article.status === 'published' || isAuthor) ? article : null

  useDocumentTitle(visible?.title ?? (loading ? null : 'Not found'))

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total > 0) setScrollProgress((window.scrollY / total) * 100)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    loadBySlug(slug)
      .then(result => {
        if (cancelled) return
        setLoaded(result)
        setLikesCount(result?.article.likes_count || 0)
      })
      .catch(() => { if (!cancelled) setLoaded(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    window.scrollTo({ top: 0 })
    return () => { cancelled = true }
  }, [slug])

  // Count one view per article per browser session.
  useEffect(() => {
    if (origin !== 'community' || !article || article.status !== 'published' || isAuthor) return
    const key = `afroarchive_viewed_${article.id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    supabase.rpc('increment_article_views', { p_article_id: article.id }).then(() => {})
  }, [origin, article, isAuthor])

  useEffect(() => {
    if (origin !== 'community' || !article || !user) { setHasLiked(false); return }
    supabase.from('article_likes').select('article_id', { head: true, count: 'exact' })
      .eq('article_id', article.id).eq('user_id', user.id)
      .then(({ count }) => setHasLiked((count ?? 0) > 0))
  }, [origin, article, user])

  const handleLike = async () => {
    if (!article) return
    if (!user) {
      toast('Sign in to like articles')
      navigate('/auth/login', { state: { from: `/article/${article.slug}` } })
      return
    }
    setLikeBusy(true)
    const next = !hasLiked
    setHasLiked(next)
    setLikesCount(c => Math.max(0, c + (next ? 1 : -1)))
    const { error } = next
      ? await supabase.from('article_likes').insert({ article_id: article.id, user_id: user.id })
      : await supabase.from('article_likes').delete().eq('article_id', article.id).eq('user_id', user.id)
    if (error) {
      setHasLiked(!next)
      setLikesCount(c => Math.max(0, c + (next ? -1 : 1)))
      toast.error('Could not save your like. Please try again.')
    }
    setLikeBusy(false)
  }

  const handleBookmark = () => {
    if (!article) return
    const wasSaved = isBookmarked(article.id)
    toggleBookmark({
      id: article.id,
      type: 'article',
      title: article.title,
      subtitle: article.excerpt || undefined,
      catalogOrCategory: article.category?.name || 'Article',
      savedAt: new Date().toISOString(),
      href: `/article/${article.slug}`,
    })
    if (wasSaved) toast('Removed from your saved items')
    else toast.success('Saved to your profile')
  }

  const handleShare = () => {
    if (!article) return
    shareArticle(article.title, window.location.href)
    if (!navigator.share) toast.success('Link copied')
  }

  const relatedArticles = visible
    ? FOUNDATIONAL_ARTICLES.filter(a => a.slug !== visible.slug && a.category?.slug && a.category.slug === visible.category?.slug).slice(0, 3)
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4" role="status">
          <div className="w-12 h-12 rounded-full border-4 border-primary-500/20 border-t-primary-600 animate-spin" />
          <p className="font-serif italic text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      </div>
    )
  }

  if (!visible) {
    return (
      <div className="min-h-screen bg-sand-50 dark:bg-dark-bg py-20">
        <div className="container-app text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sand-200 dark:bg-dark-card flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="heading-lg text-gray-900 dark:text-white mb-3">Article not found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            This article doesn't exist, has been unpublished, or the link is incorrect.
          </p>
          <Link to="/discover" className="btn btn-primary btn-md gap-2">
            <ArrowLeft className="w-4 h-4" /> Browse the archive
          </Link>
        </div>
      </div>
    )
  }

  const isSaved = isBookmarked(visible.id)
  const author = visible.author
  const authorLink = origin === 'community' && author?.username ? `/profile/${author.username}` : null
  const authorName = author?.full_name || author?.username || 'Unknown author'
  const references = visible.references_list ?? []
  const record = loaded?.record

  const avatar = (size: string, rounded: string) =>
    author?.avatar_url ? (
      <img src={author.avatar_url} alt="" className={cn(size, rounded, 'object-cover border-2 border-primary-500/40')} />
    ) : (
      <div className={cn(size, rounded, 'bg-primary-600 text-white flex items-center justify-center font-serif font-bold')}>
        {origin === 'record' ? <Archive className="w-1/2 h-1/2" /> : getAvatarFallback(authorName)}
      </div>
    )

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors pb-24">
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none" aria-hidden="true">
        <div className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-amber-500 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="border-b border-sand-200 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md sticky top-16 z-30 transition-colors">
        <div className="container-app py-3 flex items-center justify-between gap-4">
          <Link to="/discover" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-w-0">
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span>Discover</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-xs">{visible.category?.name || 'Archive'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-sand-100 dark:bg-dark-card rounded-lg p-0.5 border border-sand-200 dark:border-dark-border text-xs" role="group" aria-label="Text size">
              {([['normal', 'A', ''], ['large', 'A+', 'text-sm'], ['xlarge', 'A++', 'text-base font-bold']] as const).map(([size, label, extra]) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  aria-pressed={fontSize === size}
                  className={cn('px-2.5 py-1 rounded font-medium', extra, fontSize === size ? 'bg-white dark:bg-dark-surface shadow-xs text-primary-600 dark:text-primary-400' : 'text-gray-500')}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleBookmark}
              aria-pressed={isSaved}
              className={cn('btn btn-sm gap-1.5 border', isSaved ? 'btn-primary' : 'btn-ghost border-sand-200 dark:border-dark-border text-gray-600 dark:text-gray-300')}
            >
              <Bookmark className={cn('w-3.5 h-3.5', isSaved && 'fill-current')} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button type="button" onClick={handleShare} aria-label="Share" className="btn btn-ghost btn-sm border border-sand-200 dark:border-dark-border text-gray-600 dark:text-gray-300">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <article className="container-app pt-10">
        {visible.status !== 'published' && (
          <div className="max-w-3xl mx-auto mb-6 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <EyeOff className="w-4 h-4 flex-shrink-0" />
            {visible.status === 'under_review'
              ? 'A moderator has taken this article down for review. Only you can see it. Check the references and edit it to address the problem.'
              : 'This is a draft. Only you can see it.'}
          </div>
        )}

        <motion.header initial="hidden" animate="visible" variants={fadeUp} className="max-w-3xl mx-auto mb-10 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
            {visible.category && <span className="badge badge-primary">{visible.category.name}</span>}
            {visible.time_period && <span className="badge badge-gray">{visible.time_period}</span>}
            {visible.language && visible.language !== 'en' && (
              <span className="badge badge-gray text-2xs">{languageName(visible.language)}</span>
            )}
            {visible.country && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MapPin className="w-3 h-3 text-primary-500" />{countryDisplay(visible.country)}
              </span>
            )}
          </div>

          <h1 className="heading-xl text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white leading-[1.15] mb-6">{visible.title}</h1>

          {visible.excerpt && origin !== 'record' && (
            <p className="font-serif italic text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">{visible.excerpt}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border">
            <div className="flex items-center gap-3 text-left">
              {authorLink ? <Link to={authorLink} aria-label={authorName}>{avatar('w-12 h-12', 'rounded-full')}</Link> : avatar('w-12 h-12', 'rounded-full')}
              <div>
                <div className="flex items-center gap-1.5">
                  {authorLink ? (
                    <Link to={authorLink} className="font-serif font-bold text-base text-gray-900 dark:text-white hover:text-primary-600 transition-colors">{authorName}</Link>
                  ) : (
                    <span className="font-serif font-bold text-base text-gray-900 dark:text-white">{authorName}</span>
                  )}
                  {author?.is_verified && <ShieldCheck className="w-4 h-4 text-primary-500" aria-label="Verified" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {origin === 'record' ? 'Source of this archive record' : origin === 'editorial' ? 'Editorial introduction' : 'Community contributor'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              {origin !== 'record' && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-accent-500" />{visible.reading_time || 1} min read</span>}
              {visible.published_at && (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary-500" />{formatDate(visible.published_at)}</span>
              )}
            </div>
          </div>
        </motion.header>

        {record && recordModel3d(record) && (
          <div className="max-w-4xl mx-auto mb-12 dark">
            <Model3DViewer
              model={{ ...recordModel3d(record)!, viewerUrl: record.source_url }}
              title={visible.title}
              credit={record.attribution}
            />
          </div>
        )}

        {visible.cover_image && !(record && recordModel3d(record)) && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="max-w-4xl mx-auto mb-12">
            <figure>
              <div className="relative rounded-3xl overflow-hidden border border-sand-200 dark:border-dark-border shadow-museum aspect-[16/9] sm:aspect-[21/9] bg-sand-200 dark:bg-dark-card">
                <img src={visible.cover_image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              {(visible.cover_credit || (origin === 'record' && record?.attribution)) && (
                <figcaption className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                  {visible.cover_credit || record?.attribution}
                </figcaption>
              )}
            </figure>
          </motion.div>
        )}

        <div className="max-w-3xl mx-auto">
          {origin === 'community' && (
            <div className="flex items-center justify-between py-4 border-y border-sand-200 dark:border-dark-border mb-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={likeBusy}
                  aria-pressed={hasLiked}
                  aria-label={hasLiked ? 'Unlike' : 'Like'}
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
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Eye className="w-4 h-4 text-gray-400" />{formatNumber(visible.views_count || 0)} views
                </span>
              </div>
              {visible.status === 'published' && <AddToCollection articleId={visible.id} articleSlug={visible.slug} />}
            </div>
          )}

          {record && (
            <aside className="mb-8 p-5 rounded-2xl bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Archive className="w-4 h-4 text-primary-500" /> Provenance
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-x-4 gap-y-1.5 text-gray-600 dark:text-gray-300">
                <dt className="text-gray-400">Source</dt>
                <dd>{record.sources?.name || 'Not recorded'}</dd>
                <dt className="text-gray-400">Licence</dt>
                <dd className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-gray-400" />
                  {record.license_url ? (
                    <a href={record.license_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">{licenseLabel(record.license_type)}</a>
                  ) : licenseLabel(record.license_type)}
                </dd>
                {record.attribution && (<><dt className="text-gray-400">Attribution</dt><dd>{record.attribution}</dd></>)}
              </dl>
              {(record.source_url || record.original_url) && (
                <a href={(record.source_url || record.original_url)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-medium hover:underline pt-1">
                  View the original record <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </aside>
          )}

          {record && <RecordFacts part="facts" recordId={record.id} recordSlug={visible.slug} knowledgeType={record.knowledge_type} />}

          <div
            lang={visible.language || undefined}
            dir={isRtl(visible.language) ? 'rtl' : undefined}
            className={cn(
            'max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans',
            fontSize === 'normal' && 'text-base sm:text-lg',
            fontSize === 'large' && 'text-lg sm:text-xl leading-loose',
            fontSize === 'xlarge' && 'text-xl sm:text-2xl leading-loose font-serif'
          )}>
            {visible.content ? <ArticleBody content={visible.content} /> : (
              <p className="text-gray-500 italic">No description is available for this record yet.</p>
            )}
          </div>

          {references.length > 0 && (
            <section className="mt-14 p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border shadow-xs">
              <h2 className="flex items-center gap-2 mb-4 font-serif font-bold text-lg text-gray-900 dark:text-white">
                <BookOpen className="w-5 h-5 text-primary-500" /> References &amp; further reading
              </h2>
              <ol className="space-y-2 list-decimal pl-5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {references.map((ref, i) => <li key={i} className="pl-1 leading-relaxed">{ref}</li>)}
              </ol>
            </section>
          )}

          {record && <RecordFacts part="related" recordId={record.id} recordSlug={visible.slug} knowledgeType={record.knowledge_type} />}

          {visible.status === 'published' && (
            <CiteThis
              source={{
                kind: origin === 'record' ? 'record' : 'article',
                title: visible.title,
                author: origin === 'record'
                  ? (record?.attribution?.replace(/^(licensed under [^ ]+ by|©)\s*/i, '') || record?.sources?.name || 'AfroArchive')
                  : authorName,
                date: origin === 'record' ? null : visible.published_at,
                url: `${window.location.origin}/article/${visible.slug}`,
                publisher: origin === 'record' && record?.sources?.name ? `AfroArchive (from ${record.sources.name})` : 'AfroArchive',
                license: record?.license_type,
                licenseUrl: record?.license_url,
                attribution: record?.attribution,
              }}
            />
          )}

          <div className="mt-6 flex justify-end">
            <ReportButton
              contentType={origin === 'record' ? 'record' : 'article'}
              contentId={origin === 'community' ? visible.id : visible.slug}
              contentTitle={visible.title}
            />
          </div>

          {origin === 'community' && author && (
            <div className="mt-10 p-6 rounded-3xl bg-gradient-to-br from-sand-100 to-sand-50 dark:from-dark-card dark:to-dark-surface border border-sand-200 dark:border-dark-border flex flex-col sm:flex-row items-center gap-6">
              {authorLink ? <Link to={authorLink} aria-label={authorName}>{avatar('w-20 h-20', 'rounded-2xl')}</Link> : avatar('w-20 h-20', 'rounded-2xl')}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">{authorName}</h3>
                  {author.is_verified && <ShieldCheck className="w-4 h-4 text-primary-500" aria-label="Verified" />}
                </div>
                {author.bio && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">{author.bio}</p>}
                {authorLink && (
                  <Link to={authorLink} className="btn btn-outline btn-sm gap-1.5">
                    <User className="w-3.5 h-3.5" /><span>View profile</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {relatedArticles.length > 0 && (
          <div className="max-w-5xl mx-auto mt-20 pt-12 border-t border-sand-200 dark:border-dark-border">
            <div className="flex items-center justify-between mb-8">
              <h2 className="heading-lg text-2xl sm:text-3xl text-gray-900 dark:text-white">Keep reading</h2>
              <Link to="/discover" className="btn btn-ghost btn-sm gap-1 text-primary-600 dark:text-primary-400">
                <span>View all</span><ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map(rel => <ArticleCard key={rel.id} article={rel} variant="default" />)}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
