import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  MapPin, Globe, Calendar, ShieldCheck, Feather, BookOpen,
  Eye, Heart, Edit3, Trash2, Plus, Check,
  Camera, ExternalLink, Share2, Clock, AlertCircle, Loader2, Bookmark
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useBookmarks, type BookmarkEntry } from '@/hooks/useBookmarks'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import ImageUpload from '@/components/ui/ImageUpload'
import ProfileTabNavigation from '@/components/profile/ProfileTabNavigation'
import { useProfileTabs } from '@/components/profile/useProfileTabs'
import { ARTICLE_LANGUAGES } from '@/lib/languages'
import { normalizeUrl } from '@/lib/query'
import { cn, formatDate, formatNumber, getAvatarFallback, getAvatarColor, uniqueSlug, calculateReadingTime } from '@/lib/utils'
import type { Profile, Article, Category } from '@/types'
import toast from 'react-hot-toast'

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function ProfilePage() {
  const { username: routeUsername } = useParams<{ username?: string }>()
  const { user, profile: authProfile, loading: authLoading, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { bookmarks, removeBookmark } = useBookmarks()

  const { activeTab, setActiveTab } = useProfileTabs(location)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const [articles, setArticles] = useState<Article[]>([])
  const [articleFilter, setArticleFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [loadingArticles, setLoadingArticles] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])

  // Write Article Form
  const [writeTitle, setWriteTitle] = useState('')
  const [writeCoverImage, setWriteCoverImage] = useState('')
  const [writeCategoryId, setWriteCategoryId] = useState('')
  const [writeExcerpt, setWriteExcerpt] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [writeTimePeriod, setWriteTimePeriod] = useState('')
  const [writeCountry, setWriteCountry] = useState('')
  const [writeLanguage, setWriteLanguage] = useState('en')
  const [writeReferences, setWriteReferences] = useState('')
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null)

  // Edit Profile Form
  const [editFullName, setEditFullName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editLanguages, setEditLanguages] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editCoverUrl, setEditCoverUrl] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => { if (data) setCategories(data as Category[]) })
  }, [])

  useEffect(() => {
    // Wait for the session to be restored before deciding the visitor is signed out.
    if (authLoading) return
    async function loadProfile() {
      setLoadingProfile(true)
      try {
        if (routeUsername) {
          const { data, error } = await supabase
            .from('profiles').select('*')
            .eq('username', routeUsername.toLowerCase()).single()
          if (error || !data) {
            if (authProfile && authProfile.username === routeUsername) {
              setProfile(authProfile); setIsOwnProfile(true)
            } else { setProfile(null) }
          } else {
            setProfile(data as Profile)
            setIsOwnProfile(user ? data.id === user.id : false)
          }
        } else if (user) {
          if (authProfile) { setProfile(authProfile); setIsOwnProfile(true) }
          else {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            if (data) { setProfile(data as Profile); setIsOwnProfile(true) }
          }
        } else { navigate('/auth/login', { replace: true, state: { from: location.pathname } }); return }
      } catch (err) { console.error('Error loading profile:', err) }
      finally { setLoadingProfile(false) }
    }
    loadProfile()
  }, [routeUsername, user, authProfile, authLoading, navigate, location.pathname])

  useDocumentTitle(profile ? (profile.full_name || `@${profile.username}`) : null)

  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditFullName(profile.full_name || '')
      setEditUsername(profile.username || '')
      setEditBio(profile.bio || '')
      setEditCountry(profile.country || '')
      setEditWebsite(profile.website || '')
      setEditLanguages(profile.languages ? profile.languages.join(', ') : '')
      setEditAvatarUrl(profile.avatar_url || '')
      setEditCoverUrl(profile.cover_url || '')
    }
  }, [profile, isOwnProfile])

  useEffect(() => {
    if (!profile) return
    const profileId = profile.id
    async function loadArticles() {
      setLoadingArticles(true)
      try {
        let query = supabase.from('articles').select('*, category:categories(*)')
          .eq('author_id', profileId).order('created_at', { ascending: false })
        if (!isOwnProfile) query = query.eq('status', 'published')
        const { data, error } = await query
        if (!error && data) setArticles(data as Article[])
      } catch (err) { console.error('Error loading articles:', err) }
      finally { setLoadingArticles(false) }
    }
    loadArticles()
  }, [profile, isOwnProfile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    const username = editUsername.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      toast.error('Username must be 3–30 characters: lowercase letters, numbers or underscores.')
      return
    }
    if (editBio.trim().length > 500) { toast.error('Bio must be 500 characters or fewer.'); return }
    const website = editWebsite.trim() ? normalizeUrl(editWebsite) : null
    if (editWebsite.trim() && !website) { toast.error('Please enter a valid website address.'); return }
    const avatarUrl = editAvatarUrl.trim() ? normalizeUrl(editAvatarUrl, { httpsOnly: true }) : null
    if (editAvatarUrl.trim() && !avatarUrl) { toast.error('Avatar URL must be a secure https:// link.'); return }
    const coverUrl = editCoverUrl.trim() ? normalizeUrl(editCoverUrl, { httpsOnly: true }) : null
    if (editCoverUrl.trim() && !coverUrl) { toast.error('Banner URL must be a secure https:// link.'); return }

    setIsSavingProfile(true)
    try {
      if (username !== profile.username) {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('username', username)
        if (count) { toast.error('That username is already taken.'); return }
      }
      const updates = {
        full_name: editFullName.trim() || null,
        username,
        bio: editBio.trim() || null,
        country: editCountry.trim() || null,
        website,
        languages: editLanguages.split(',').map(l => l.trim()).filter(Boolean).slice(0, 12),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      }
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
      if (error) throw error
      toast.success('Profile updated')
      await refreshProfile()
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      setActiveTab('articles')
      if (routeUsername && routeUsername !== username) navigate(`/profile/${username}`, { replace: true })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not update your profile.')
    } finally { setIsSavingProfile(false) }
  }

  const handleSaveArticle = async (status: 'published' | 'draft' | 'under_review') => {
    if (!user) { toast.error('Please sign in to write.'); navigate('/auth/login', { state: { from: '/write' } }); return }

    const title = writeTitle.trim()
    const content = writeContent.trim()
    const excerpt = writeExcerpt.trim()
    if (title.length < 5) { toast.error('Title must be at least 5 characters.'); return }
    if (title.length > 200) { toast.error('Title must be 200 characters or fewer.'); return }
    if (!content) { toast.error('Please write the article body.'); return }
    if (status === 'published' && content.length < 300) {
      toast.error('Published articles need at least 300 characters. Save as a draft to keep working.')
      return
    }
    if (excerpt.length > 400) { toast.error('Excerpt must be 400 characters or fewer.'); return }
    const coverImage = writeCoverImage.trim() ? normalizeUrl(writeCoverImage, { httpsOnly: true }) : null
    if (writeCoverImage.trim() && !coverImage) { toast.error('Cover image must be a secure https:// link.'); return }

    const existing = editingArticleId ? articles.find(a => a.id === editingArticleId) : undefined
    // Articles taken down by a moderator stay under review until a moderator republishes them.
    const underReview = existing?.status === 'under_review'
    if (underReview) status = 'under_review'

    setIsSubmittingArticle(true)
    try {
      const payload = {
        title,
        excerpt: excerpt || null,
        content,
        cover_image: coverImage,
        category_id: writeCategoryId || null,
        status,
        reading_time: calculateReadingTime(content),
        time_period: writeTimePeriod.trim() || null,
        country: writeCountry.trim() || null,
        language: writeLanguage,
        references_list: writeReferences.split('\n').map(r => r.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean),
        // Set on first publish only; the database trigger enforces the same rule.
        ...(status === 'published' && !existing?.published_at ? { published_at: new Date().toISOString() } : {}),
      }
      if (editingArticleId) {
        // Keep the original URL so shared links keep working.
        const keepSlug = existing && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(existing.slug)
        const { error } = await supabase.from('articles')
          .update(keepSlug ? payload : { ...payload, slug: uniqueSlug(title) })
          .eq('id', editingArticleId).eq('author_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('articles').insert([{ ...payload, author_id: user.id, slug: uniqueSlug(title) }])
        if (error) throw error
      }
      toast.success(
        underReview ? 'Changes saved. A moderator will review the article before it is republished.'
          : status === 'published' ? (editingArticleId ? 'Article updated' : 'Article published') : 'Draft saved'
      )
      setWriteTitle(''); setWriteCoverImage(''); setWriteCategoryId(''); setWriteExcerpt('')
      setWriteContent(''); setWriteTimePeriod(''); setWriteCountry(''); setWriteReferences(''); setWriteLanguage('en')
      setEditingArticleId(null)
      const { data } = await supabase.from('articles').select('*, category:categories(*)').eq('author_id', user.id).order('created_at', { ascending: false })
      if (data) setArticles(data as Article[])
      setActiveTab('articles')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.')
    } finally { setIsSubmittingArticle(false) }
  }

  const handleStartEditArticle = (art: Article) => {
    setEditingArticleId(art.id); setWriteTitle(art.title)
    setWriteCoverImage(art.cover_image || ''); setWriteCategoryId(art.category_id || '')
    setWriteExcerpt(art.excerpt || ''); setWriteContent(art.content || '')
    setWriteTimePeriod(art.time_period || ''); setWriteCountry(art.country || ''); setWriteLanguage(art.language || 'en')
    setWriteReferences(art.references_list ? art.references_list.join('\n') : '')
    setActiveTab('write'); window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm('Delete this article permanently?')) return
    try {
      const { error } = await supabase.from('articles').delete().eq('id', id).eq('author_id', user?.id)
      if (error) throw error
      toast.success('Article deleted'); setArticles(prev => prev.filter(a => a.id !== id))
      if (editingArticleId === id) setEditingArticleId(null)
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Could not delete the article.') }
  }

  const handleShareProfile = async () => {
    if (!profile) return
    const url = `${window.location.origin}/profile/${profile.username}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Profile link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  // ─── LOADING STATE ─────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-accent-400 mx-auto" />
          <h2 className="heading-md text-gray-900 dark:text-white">Profile Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">This profile does not exist or may have been moved.</p>
          <Link to="/" className="btn btn-primary btn-md inline-block">Return Home</Link>
        </div>
      </div>
    )
  }

  const filteredArticles = articles.filter(art => {
    if (articleFilter === 'published') return art.status === 'published'
    if (articleFilter === 'draft') return art.status === 'draft'
    return true
  })

  return (
    <div className="pb-24">
      {/* ─── Cover Banner ────────────────────────────────────── */}
      <div className="relative w-full h-48 sm:h-64 lg:h-72 overflow-hidden">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full animated-gradient" />
        )}
        {isOwnProfile && (
          <button onClick={() => setActiveTab('settings')} type="button"
            className="absolute top-4 right-4 btn btn-sm bg-black/50 text-white border border-white/20 backdrop-blur-md gap-1.5 hover:bg-black/70">
            <Camera className="w-3.5 h-3.5" /> Update Banner
          </button>
        )}
      </div>

      {/* ─── Profile Header ──────────────────────────────────── */}
      <div className="container-app -mt-16 relative z-10">
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || profile.username}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white dark:border-dark-surface shadow-lg" />
                ) : (
                  <div className={cn('w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-white text-3xl font-serif font-bold border-4 border-white dark:border-dark-surface shadow-lg', getAvatarColor(profile.username))}>
                    {getAvatarFallback(profile.full_name || profile.username)}
                  </div>
                )}
                {profile.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-primary-500 text-white p-1.5 rounded-full shadow" title="Verified">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="heading-lg text-gray-900 dark:text-white">{profile.full_name || profile.username}</h1>
                  {profile.role && profile.role !== 'user' && (
                    <span className="badge badge-primary">{profile.role}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed pt-1">{profile.bio}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={handleShareProfile} type="button"
                className="btn btn-ghost border border-sand-200 dark:border-dark-border btn-sm" title="Share">
                <Share2 className="w-4 h-4" />
              </button>
              {isOwnProfile ? (
                <>
                  <button onClick={() => setActiveTab('settings')} type="button" className="btn btn-outline btn-sm gap-2">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                  <button onClick={() => { setEditingArticleId(null); setActiveTab('write') }} type="button" className="btn btn-primary btn-sm gap-2">
                    <Feather className="w-3.5 h-3.5" /> Write Article
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Meta chips */}
          <div className="mt-6 pt-5 border-t border-sand-200 dark:border-dark-border flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-gray-500 dark:text-gray-400">
            {profile.country && (
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary-500" /><span>{profile.country}</span></div>
            )}
            {profile.website && (
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary-600 dark:text-accent-400 hover:underline">
                <Globe className="w-3.5 h-3.5" /><span>{profile.website.replace(/^https?:\/\//, '')}</span><ExternalLink className="w-3 h-3" />
              </a>
            )}
            {profile.languages && profile.languages.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {profile.languages.map(lang => (
                  <span key={lang} className="badge badge-gray">{lang}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5 ml-auto text-gray-400 dark:text-gray-500">
              <Calendar className="w-3.5 h-3.5" /><span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats ───────────────────────────────────────────── */}
      <StatsBar articles={articles} />

      {/* ─── Tabs ────────────────────────────────────────────── */}
      <div className="container-app">
        <ProfileTabNavigation
          activeTab={activeTab}
          articleCount={articles.length}
          bookmarkCount={bookmarks.length}
          editingArticle={!!editingArticleId}
          isOwner={isOwnProfile}
          onChange={(tab) => {
            if (tab === 'write') setEditingArticleId(null)
            setActiveTab(tab)
          }}
        />

        {/* ─── Articles Tab ────────────────────────────────────── */}
        {activeTab === 'articles' && (
          <ArticlesTab articles={filteredArticles} articleFilter={articleFilter} setArticleFilter={setArticleFilter}
            isOwnProfile={isOwnProfile} loading={loadingArticles} profile={profile}
            onEdit={handleStartEditArticle} onDelete={handleDeleteArticle} onWrite={() => setActiveTab('write')} />
        )}

        {/* ─── Write Tab ───────────────────────────────────────── */}
        {activeTab === 'write' && isOwnProfile && (
          <WriteTab
            writeTitle={writeTitle} setWriteTitle={setWriteTitle} writeCoverImage={writeCoverImage} setWriteCoverImage={setWriteCoverImage}
            writeCategoryId={writeCategoryId} setWriteCategoryId={setWriteCategoryId} writeExcerpt={writeExcerpt} setWriteExcerpt={setWriteExcerpt}
            writeContent={writeContent} setWriteContent={setWriteContent} writeTimePeriod={writeTimePeriod} setWriteTimePeriod={setWriteTimePeriod}
            writeCountry={writeCountry} setWriteCountry={setWriteCountry} writeLanguage={writeLanguage} setWriteLanguage={setWriteLanguage} writeReferences={writeReferences} setWriteReferences={setWriteReferences}
            categories={categories} editingArticleId={editingArticleId} isSubmitting={isSubmittingArticle}
            onSave={handleSaveArticle}
          />
        )}

        {/* ─── Saved Heritage Tab ──────────────────────────────── */}
        {activeTab === 'saved' && isOwnProfile && (
          <SavedTab bookmarks={bookmarks} onRemove={removeBookmark} />
        )}

        {/* ─── Settings Tab ────────────────────────────────────── */}
        {activeTab === 'settings' && isOwnProfile && (
          <SettingsTab
            editFullName={editFullName} setEditFullName={setEditFullName} editUsername={editUsername} setEditUsername={setEditUsername}
            editBio={editBio} setEditBio={setEditBio} editCountry={editCountry} setEditCountry={setEditCountry}
            editWebsite={editWebsite} setEditWebsite={setEditWebsite} editLanguages={editLanguages} setEditLanguages={setEditLanguages}
            editAvatarUrl={editAvatarUrl} setEditAvatarUrl={setEditAvatarUrl} editCoverUrl={editCoverUrl} setEditCoverUrl={setEditCoverUrl}
            isSaving={isSavingProfile} onSave={handleSaveProfile} onCancel={() => setActiveTab('articles')} onSignOut={() => signOut()}
          />
        )}
      </div>
    </div>
  )
}

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

function StatsBar({ articles }: { articles: Article[] }) {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true })
  const published = articles.filter(a => a.status === 'published')
  const stats = [
    { icon: <BookOpen className="w-5 h-5" />, value: published.length, label: 'Published' },
    { icon: <Eye className="w-5 h-5" />, value: published.reduce((sum, a) => sum + (a.views_count || 0), 0), label: 'Reads' },
    { icon: <Heart className="w-5 h-5" />, value: published.reduce((sum, a) => sum + (a.likes_count || 0), 0), label: 'Likes received' },
  ]
  return (
    <section ref={ref} className="container-app mt-6">
      <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <motion.div key={s.label} variants={fadeUp} className="card p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
              {s.icon}
            </div>
            <div>
              <div className="text-xl font-bold font-serif text-gray-900 dark:text-white">{formatNumber(s.value)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function ArticlesTab({ articles, articleFilter, setArticleFilter, isOwnProfile, loading, profile, onEdit, onDelete, onWrite }: {
  articles: Article[]; articleFilter: string; setArticleFilter: (f: 'all' | 'published' | 'draft') => void
  isOwnProfile: boolean; loading: boolean; profile: Profile
  onEdit: (a: Article) => void; onDelete: (id: string) => void; onWrite: () => void
}) {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true })
  return (
    <div ref={ref} className="mt-8 space-y-6">
      {isOwnProfile && articles.length > 0 && (
        <div className="flex items-center gap-2">
          {(['all', 'published', 'draft'] as const).map(f => (
            <button key={f} onClick={() => setArticleFilter(f)} type="button"
              className={cn('badge transition-all cursor-pointer', articleFilter === f ? 'badge-primary' : 'badge-gray hover:border-primary-400/40')}>
              {f === 'all' ? 'All' : f === 'published' ? 'Published' : 'Drafts'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" /><p className="text-sm text-gray-500">Loading articles…</p></div>
      ) : articles.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(art => (
            <motion.div key={art.id} variants={fadeUp}>
              <div className="card-hover flex flex-col overflow-hidden group h-full">
                {art.cover_image && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={art.cover_image} alt={art.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-center justify-between mb-3">
                    {art.category ? (
                      <span className="badge badge-primary">{art.category.name}</span>
                    ) : <span className="badge badge-gray">General</span>}
                    {isOwnProfile && (
                      <span className={cn('badge text-[10px]', art.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400')}>
                        {art.status}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
                    <Link to={`/article/${art.slug}`} className="hover:underline">{art.title}</Link>
                  </h3>
                  {art.excerpt && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">{art.excerpt}</p>}
                  <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{art.reading_time || 1}m</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{art.views_count || 0}</span>
                    </div>
                    {isOwnProfile && (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => onEdit(art)} className="p-1.5 hover:text-primary-500 transition-colors" aria-label={`Edit ${art.title}`}><Edit3 className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => onDelete(art.id)} className="p-1.5 hover:text-red-500 transition-colors" aria-label={`Delete ${art.title}`}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="card p-12 text-center space-y-4">
          <BookOpen className="w-10 h-10 text-primary-400/60 mx-auto" />
          <h3 className="heading-sm text-gray-900 dark:text-white">No Articles Yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {isOwnProfile ? 'Start documenting African history and scholarly insights.' : `@${profile.username} hasn't published yet.`}
          </p>
          {isOwnProfile && (
            <button onClick={onWrite} className="btn btn-primary btn-md gap-2"><Plus className="w-4 h-4" /> Write Your First Article</button>
          )}
        </div>
      )}
    </div>
  )
}

function WriteTab({ writeTitle, setWriteTitle, writeCoverImage, setWriteCoverImage, writeCategoryId, setWriteCategoryId,
  writeExcerpt, setWriteExcerpt, writeContent, setWriteContent, writeTimePeriod, setWriteTimePeriod,
  writeCountry, setWriteCountry, writeLanguage, setWriteLanguage, writeReferences, setWriteReferences, categories, editingArticleId, isSubmitting, onSave,
}: {
  writeTitle: string; setWriteTitle: (v: string) => void; writeCoverImage: string; setWriteCoverImage: (v: string) => void
  writeCategoryId: string; setWriteCategoryId: (v: string) => void; writeExcerpt: string; setWriteExcerpt: (v: string) => void
  writeContent: string; setWriteContent: (v: string) => void; writeTimePeriod: string; setWriteTimePeriod: (v: string) => void
  writeCountry: string; setWriteCountry: (v: string) => void; writeLanguage: string; setWriteLanguage: (v: string) => void; writeReferences: string; setWriteReferences: (v: string) => void
  categories: Category[]; editingArticleId: string | null; isSubmitting: boolean
  onSave: (status: 'published' | 'draft') => void
}) {
  return (
    <div className="mt-8 card p-6 sm:p-10 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sand-200 dark:border-dark-border pb-6 gap-4">
        <div>
          <span className="badge badge-primary mb-2">Publishing Desk</span>
          <h2 className="heading-md text-gray-900 dark:text-white">{editingArticleId ? 'Edit Article' : 'Write a New Article'}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Contribute research, analysis, and stories to AfroArchive.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onSave('draft')} disabled={isSubmitting} className="btn btn-outline btn-sm">Save Draft</button>
          <button type="button" onClick={() => onSave('published')} disabled={isSubmitting} className="btn btn-primary btn-sm gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Feather className="w-4 h-4" />}
            {editingArticleId ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Title *</label>
          <input type="text" value={writeTitle} onChange={e => setWriteTitle(e.target.value)} placeholder="e.g. The Mathematical Legacy of Ancient Timbuktu"
            className="input-lg" />
        </div>

        <ImageUpload label="Cover image" value={writeCoverImage} onChange={setWriteCoverImage} bucket="article-images" previewClassName="w-32 h-20" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Category</label>
            <select value={writeCategoryId} onChange={e => setWriteCategoryId(e.target.value)} className="input">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Time Period</label>
            <input type="text" value={writeTimePeriod} onChange={e => setWriteTimePeriod(e.target.value)} placeholder="e.g. 13th Century" className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Country / Region</label>
            <input type="text" value={writeCountry} onChange={e => setWriteCountry(e.target.value)} placeholder="e.g. Mali" className="input" />
          </div>
          <div>
            <label htmlFor="write-language" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Written in</label>
            <select id="write-language" value={writeLanguage} onChange={e => setWriteLanguage(e.target.value)} className="input">
              {ARTICLE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}{l.native !== l.name ? ` (${l.native})` : ''}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Excerpt</label>
          <textarea rows={2} value={writeExcerpt} onChange={e => setWriteExcerpt(e.target.value)} placeholder="A brief summary…" className="input" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Article Body *</label>
            <span className="text-xs text-gray-400">{calculateReadingTime(writeContent)}m · {writeContent.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>
          <textarea id="write-body" rows={14} value={writeContent} onChange={e => setWriteContent(e.target.value)}
            aria-describedby="write-body-help"
            placeholder="Write your article here…" className="input text-sm leading-relaxed" />
          <p id="write-body-help" className="mt-2 text-xs text-gray-400">
            Leave a blank line between paragraphs. Use <code>## </code> or <code>### </code> for headings, <code>- </code> for lists, <code>&gt; </code> for quotes and <code>**bold**</code>.
            {writeContent.trim().length < 300 && ` Published articles need at least 300 characters (${writeContent.trim().length}/300).`}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">References (one per line)</label>
          <textarea rows={3} value={writeReferences} onChange={e => setWriteReferences(e.target.value)} placeholder="• Source 1&#10;• Source 2" className="input text-xs" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-sand-200 dark:border-dark-border">
          <button type="button" onClick={() => onSave('draft')} disabled={isSubmitting} className="btn btn-outline btn-md">Save Draft</button>
          <button type="button" onClick={() => onSave('published')} disabled={isSubmitting} className="btn btn-primary btn-md gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Feather className="w-4 h-4" />}
            {editingArticleId ? 'Update & Publish' : 'Publish Article'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingsTab({ editFullName, setEditFullName, editUsername, setEditUsername, editBio, setEditBio,
  editCountry, setEditCountry, editWebsite, setEditWebsite, editLanguages, setEditLanguages,
  editAvatarUrl, setEditAvatarUrl, editCoverUrl, setEditCoverUrl, isSaving, onSave, onCancel, onSignOut,
}: {
  editFullName: string; setEditFullName: (v: string) => void; editUsername: string; setEditUsername: (v: string) => void
  editBio: string; setEditBio: (v: string) => void; editCountry: string; setEditCountry: (v: string) => void
  editWebsite: string; setEditWebsite: (v: string) => void; editLanguages: string; setEditLanguages: (v: string) => void
  editAvatarUrl: string; setEditAvatarUrl: (v: string) => void; editCoverUrl: string; setEditCoverUrl: (v: string) => void
  isSaving: boolean; onSave: (e: React.FormEvent) => void; onCancel: () => void; onSignOut: () => void
}) {
  return (
    <form onSubmit={onSave} className="mt-8 card p-6 sm:p-10 space-y-6 animate-fade-in">
      <div className="border-b border-sand-200 dark:border-dark-border pb-4">
        <span className="badge badge-primary mb-2">Settings</span>
        <h2 className="heading-md text-gray-900 dark:text-white">Edit Profile</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Full Name</label>
          <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} placeholder="Your name" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Username</label>
          <input type="text" required value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="username" className="input" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Bio</label>
        <textarea rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell the community about yourself…" className="input" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Country / Region</label>
          <input type="text" value={editCountry} onChange={e => setEditCountry(e.target.value)} placeholder="e.g. Nigeria" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Website</label>
          <input type="text" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="https://..." className="input" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Languages (comma separated)</label>
        <input type="text" value={editLanguages} onChange={e => setEditLanguages(e.target.value)} placeholder="Yoruba, English, French" className="input" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImageUpload label="Profile photo" value={editAvatarUrl} onChange={setEditAvatarUrl} bucket="avatars" maxDimension={512} previewClassName="w-20 h-20" />
        <ImageUpload label="Banner" value={editCoverUrl} onChange={setEditCoverUrl} bucket="avatars" maxDimension={1800} previewClassName="w-32 h-20" />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-sand-200 dark:border-dark-border">
        <button type="button" onClick={onSignOut} className="text-red-500 hover:text-red-400 text-sm font-medium">Sign Out</button>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn btn-ghost border border-sand-200 dark:border-dark-border btn-sm">Cancel</button>
          <button type="submit" disabled={isSaving} className="btn btn-primary btn-md gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
          </button>
        </div>
      </div>
    </form>
  )
}

function SavedTab({ bookmarks, onRemove }: { bookmarks: BookmarkEntry[]; onRemove: (id: string) => void }) {
  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bm) => (
            <div key={bm.id} className="card-hover p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-primary">{bm.type}</span>
                  <button type="button" onClick={() => onRemove(bm.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" aria-label={`Remove ${bm.title} from saved`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2">{bm.title}</h3>
                {bm.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">{bm.subtitle}</p>}
              </div>
              <div className="pt-4 border-t border-sand-200 dark:border-dark-border mt-auto flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">{bm.catalogOrCategory}</span>
                {bm.href || bm.type === 'article' ? (
                  <Link to={bm.href || `/article/${bm.id}`} className="btn btn-outline btn-sm gap-1">Read →</Link>
                ) : (
                  <Link to="/museum" className="btn btn-outline btn-sm gap-1">Open in Museum →</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center space-y-4">
          <Bookmark className="w-10 h-10 text-primary-400/60 mx-auto" />
          <h3 className="heading-sm text-gray-900 dark:text-white">Nothing saved yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Save articles and museum objects to find them here. Saved items are stored in this browser.
          </p>
          <Link to="/museum" className="btn btn-primary btn-md inline-block">Explore Virtual Museum</Link>
        </div>
      )}
    </div>
  )
}
