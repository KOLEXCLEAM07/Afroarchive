import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Globe, Layers, Loader2, Lock, Trash2, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/lib/utils'
import ArticleCard from '@/components/articles/ArticleCard'
import ReportButton from '@/components/moderation/ReportButton'
import type { Article, Collection } from '@/types'

export default function CollectionDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [collection, setCollection] = useState<Collection | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useDocumentTitle(collection?.title ?? null)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    async function load() {
      setState('loading')
      const { data, error } = await supabase
        .from('collections')
        .select('*, owner:profiles!collections_owner_id_fkey(*)')
        .eq('slug', slug)
        .maybeSingle()
      if (cancelled) return
      if (error) { setState('error'); return }
      const col = data as Collection | null
      if (!col || (!col.is_public && col.owner_id !== user?.id)) { setState('missing'); return }

      const { data: items, error: itemsError } = await supabase
        .from('collection_items')
        .select('added_at, article:articles(*, author:profiles!articles_author_id_fkey(*), category:categories(*))')
        .eq('collection_id', col.id)
        .order('added_at', { ascending: false })
      if (cancelled) return
      if (itemsError) { setState('error'); return }
      const list = ((items ?? []) as unknown as Array<{ article: Article | null }>)
        .map(i => i.article)
        .filter((a): a is Article => !!a && (a.status === 'published' || a.author_id === user?.id))
      setCollection(col)
      setArticles(list)
      setState('ready')
    }
    load()
    return () => { cancelled = true }
  }, [slug, user, authLoading, reloadKey])

  // Old theme links (/collections/history) fall through to the matching topic.
  if (state === 'missing') return <Navigate to={`/discover?category=${encodeURIComponent(slug)}`} replace />

  if (state === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card p-10 text-center max-w-md">
          <AlertCircle className="w-9 h-9 text-amber-500 mx-auto mb-3" />
          <h1 className="heading-sm text-gray-900 dark:text-white mb-2">Could not load this collection</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">There was a problem reaching the archive. This is not a “not found” — the collection may still exist.</p>
          <div className="flex gap-2 justify-center">
            <button type="button" onClick={() => setReloadKey(k => k + 1)} className="btn btn-primary btn-md">Try again</button>
            <Link to="/collections" className="btn btn-outline btn-md">All collections</Link>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'loading' || !collection) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const isOwner = user?.id === collection.owner_id

  const toggleVisibility = async () => {
    setBusy(true)
    const { error } = await supabase.from('collections').update({ is_public: !collection.is_public }).eq('id', collection.id)
    setBusy(false)
    if (error) { toast.error('Could not update the collection.'); return }
    setCollection({ ...collection, is_public: !collection.is_public })
    toast.success(collection.is_public ? 'Collection is now private' : 'Collection is now public')
  }

  const removeItem = async (articleId: string) => {
    const { error } = await supabase.from('collection_items').delete().eq('collection_id', collection.id).eq('article_id', articleId)
    if (error) { toast.error('Could not remove the article.'); return }
    setArticles(prev => prev.filter(a => a.id !== articleId))
  }

  const deleteCollection = async () => {
    if (!window.confirm(`Delete “${collection.title}”? The articles themselves are not affected.`)) return
    setBusy(true)
    await supabase.from('collection_items').delete().eq('collection_id', collection.id)
    const { error } = await supabase.from('collections').delete().eq('id', collection.id)
    setBusy(false)
    if (error) { toast.error('Could not delete the collection.'); return }
    toast.success('Collection deleted')
    navigate('/collections', { replace: true })
  }

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg py-10">
      <div className="container-app">
        <Link to="/collections" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Collections
        </Link>

        <header className="card p-6 sm:p-8 mb-8 flex flex-col md:flex-row gap-6 md:items-end justify-between">
          <div className="flex gap-5 items-start">
            {collection.cover_image ? (
              <img src={collection.cover_image} alt="" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-2xl animated-gradient flex items-center justify-center flex-shrink-0">
                <Layers className="w-8 h-8 text-white/70" />
              </div>
            )}
            <div>
              <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                {collection.is_public ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {collection.is_public ? 'Public collection' : 'Private collection'}
                {collection.owner?.username && (
                  <> · curated by <Link to={`/profile/${collection.owner.username}`} className="text-primary-600 dark:text-primary-400 hover:underline">@{collection.owner.username}</Link></>
                )}
              </p>
              <h1 className="heading-lg text-gray-900 dark:text-white">{collection.title}</h1>
              {collection.description && <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">{collection.description}</p>}
              <p className="text-xs text-gray-400 mt-2">
                {articles.length} article{articles.length === 1 ? '' : 's'} · updated {formatDate(collection.updated_at || collection.created_at)}
              </p>
            </div>
          </div>
          {!isOwner && (
            <ReportButton contentType="collection" contentId={collection.slug} contentTitle={collection.title} className="self-start md:self-auto" />
          )}
          {isOwner && (
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" onClick={toggleVisibility} disabled={busy} className="btn btn-outline btn-sm gap-1.5">
                {collection.is_public ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                {collection.is_public ? 'Make private' : 'Make public'}
              </button>
              <button type="button" onClick={deleteCollection} disabled={busy} className="btn btn-ghost btn-sm gap-1.5 text-red-600 border border-red-200 dark:border-red-900/50">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </header>

        {articles.length === 0 ? (
          <div className="card p-12 text-center max-w-xl mx-auto">
            <Layers className="w-10 h-10 text-primary-400/60 mx-auto mb-3" />
            <h2 className="heading-sm text-gray-900 dark:text-white mb-2">This collection is empty</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {isOwner ? 'Open any community article and use “Add to collection” to start curating.' : 'The curator hasn’t added any articles yet.'}
            </p>
            {isOwner && <Link to="/discover?type=articles" className="btn btn-primary btn-md">Find articles</Link>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <div key={article.id} className="relative">
                <ArticleCard article={article} className="h-full" />
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => removeItem(article.id)}
                    aria-label={`Remove ${article.title} from this collection`}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
