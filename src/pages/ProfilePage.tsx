import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  User, Mail, MapPin, Globe, Calendar, ShieldCheck, Feather, BookOpen,
  Eye, Users, UserCheck, Heart, Bookmark, Edit3, Trash2, Plus, Check,
  Camera, ExternalLink, Share2, Sparkles, Clock, AlertCircle, Loader2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, uploadFile, STORAGE_BUCKETS } from '@/lib/supabase'
import { cn, formatDate, formatRelativeDate, formatNumber, getAvatarFallback, getAvatarColor, slugify, calculateReadingTime } from '@/lib/utils'
import type { Profile, Article, Category } from '@/types'
import { useBookmarks } from '@/hooks/useBookmarks'
import toast from 'react-hot-toast'

type ProfileTab = 'articles' | 'write' | 'saved' | 'settings'

export default function ProfilePage() {
  const { username: routeUsername } = useParams<{ username?: string }>()
  const { user, profile: authProfile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { bookmarks, removeBookmark } = useBookmarks()

  // Determine initial tab from route or query
  const queryTab = new URLSearchParams(location.search).get('tab') as ProfileTab | null
  const isWriteRoute = location.pathname === '/write'
  const [activeTab, setActiveTab] = useState<ProfileTab>(isWriteRoute ? 'write' : queryTab || 'articles')

  // Profile data state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  // Articles state
  const [articles, setArticles] = useState<Article[]>([])
  const [articleFilter, setArticleFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [loadingArticles, setLoadingArticles] = useState(false)

  // Categories for article writer
  const [categories, setCategories] = useState<Category[]>([])

  // Write Article Form State
  const [writeTitle, setWriteTitle] = useState('')
  const [writeCoverImage, setWriteCoverImage] = useState('')
  const [writeCategoryId, setWriteCategoryId] = useState('')
  const [writeExcerpt, setWriteExcerpt] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [writeTimePeriod, setWriteTimePeriod] = useState('')
  const [writeCountry, setWriteCountry] = useState('')
  const [writeReferences, setWriteReferences] = useState('')
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null)

  // Edit Profile Form State
  const [editFullName, setEditFullName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editLanguages, setEditLanguages] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editCoverUrl, setEditCoverUrl] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Fetch Categories once
  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setCategories(data as Category[])
      })
  }, [])

  // Sync tab with route changes
  useEffect(() => {
    if (location.pathname === '/write') {
      setActiveTab('write')
    } else if (queryTab) {
      setActiveTab(queryTab)
    }
  }, [location.pathname, queryTab])

  // Load Profile
  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true)
      try {
        // If route has username, query by username; otherwise query by logged-in user
        if (routeUsername) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', routeUsername.toLowerCase())
            .single()

          if (error || !data) {
            // If viewing own username or fallback
            if (authProfile && authProfile.username === routeUsername) {
              setProfile(authProfile)
              setIsOwnProfile(true)
            } else {
              setProfile(null)
            }
          } else {
            setProfile(data as Profile)
            setIsOwnProfile(user ? data.id === user.id : false)
          }
        } else if (user) {
          // No username param -> viewing own profile
          if (authProfile) {
            setProfile(authProfile)
            setIsOwnProfile(true)
          } else {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
            if (data) {
              setProfile(data as Profile)
              setIsOwnProfile(true)
            }
          }
        } else {
          // Not logged in and no username
          navigate('/auth/login')
          return
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [routeUsername, user, authProfile, navigate])

  // Populate Edit Profile Form when profile loads
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

  // Load Articles for this profile
  useEffect(() => {
    if (!profile) return
    const profileId = profile.id

    async function loadArticles() {
      setLoadingArticles(true)
      try {
        let query = supabase
          .from('articles')
          .select('*, category:categories(*)')
          .eq('author_id', profileId)
          .order('created_at', { ascending: false })

        // If not own profile, only fetch published articles
        if (!isOwnProfile) {
          query = query.eq('status', 'published')
        }

        const { data, error } = await query
        if (!error && data) {
          setArticles(data as Article[])
        }
      } catch (err) {
        console.error('Error loading articles:', err)
      } finally {
        setLoadingArticles(false)
      }
    }

    loadArticles()
  }, [profile, isOwnProfile])

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    setIsSavingProfile(true)
    try {
      const languagesArray = editLanguages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean)

      const updates = {
        full_name: editFullName.trim(),
        username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: editBio.trim() || null,
        country: editCountry.trim() || null,
        website: editWebsite.trim() || null,
        languages: languagesArray,
        avatar_url: editAvatarUrl.trim() || null,
        cover_url: editCoverUrl.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      await refreshProfile()
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
      setActiveTab('articles')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Handle Publish or Save Draft Article
  const handleSaveArticle = async (status: 'published' | 'draft') => {
    if (!user) {
      toast.error('You must be signed in to write an article.')
      navigate('/auth/login')
      return
    }

    if (!writeTitle.trim()) {
      toast.error('Please provide an article title.')
      return
    }

    if (!writeContent.trim()) {
      toast.error('Please write some content for your article.')
      return
    }

    setIsSubmittingArticle(true)
    try {
      const readingTime = calculateReadingTime(writeContent)
      const baseSlug = slugify(writeTitle)
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`
      const refList = writeReferences
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)

      const articlePayload = {
        author_id: user.id,
        title: writeTitle.trim(),
        slug: uniqueSlug,
        excerpt: writeExcerpt.trim() || null,
        content: writeContent.trim(),
        cover_image: writeCoverImage.trim() || null,
        category_id: writeCategoryId || null,
        status: status,
        reading_time: readingTime,
        time_period: writeTimePeriod.trim() || null,
        country: writeCountry.trim() || null,
        references_list: refList,
        published_at: status === 'published' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      if (editingArticleId) {
        // Update existing article
        const { error } = await supabase
          .from('articles')
          .update(articlePayload)
          .eq('id', editingArticleId)
          .eq('author_id', user.id)

        if (error) throw error
        toast.success(`Article ${status === 'published' ? 'published' : 'saved as draft'}!`)
      } else {
        // Create new article
        const { error } = await supabase
          .from('articles')
          .insert([articlePayload])

        if (error) throw error

        // Increment author's articles_count in profile if published
        if (status === 'published' && profile) {
          await supabase
            .from('profiles')
            .update({ articles_count: (profile.articles_count || 0) + 1 })
            .eq('id', user.id)
          setProfile((p) => p ? { ...p, articles_count: (p.articles_count || 0) + 1 } : null)
        }

        toast.success(status === 'published' ? '🎉 Article published live!' : 'Article saved to drafts.')
      }

      // Reset form
      setWriteTitle('')
      setWriteCoverImage('')
      setWriteCategoryId('')
      setWriteExcerpt('')
      setWriteContent('')
      setWriteTimePeriod('')
      setWriteCountry('')
      setWriteReferences('')
      setEditingArticleId(null)

      // Reload articles and switch to articles tab
      const { data } = await supabase
        .from('articles')
        .select('*, category:categories(*)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setArticles(data as Article[])

      setActiveTab('articles')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save article.')
    } finally {
      setIsSubmittingArticle(false)
    }
  }

  // Handle Edit existing article
  const handleStartEditArticle = (art: Article) => {
    setEditingArticleId(art.id)
    setWriteTitle(art.title)
    setWriteCoverImage(art.cover_image || '')
    setWriteCategoryId(art.category_id || '')
    setWriteExcerpt(art.excerpt || '')
    setWriteContent(art.content || '')
    setWriteTimePeriod(art.time_period || '')
    setWriteCountry(art.country || '')
    setWriteReferences(art.references ? art.references.join('\n') : '')
    setActiveTab('write')
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  // Handle Delete article
  const handleDeleteArticle = async (articleId: string) => {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)
        .eq('author_id', user?.id)

      if (error) throw error

      toast.success('Article deleted.')
      setArticles((prev) => prev.filter((a) => a.id !== articleId))
      if (profile && profile.articles_count > 0) {
        setProfile((p) => p ? { ...p, articles_count: p.articles_count - 1 } : null)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete article.')
    }
  }

  // Copy Profile link
  const handleShareProfile = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success('Profile URL copied to clipboard!')
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-dark-bg flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-ivory-400">
          <Loader2 className="w-8 h-8 animate-spin text-bronze-400" />
          <p className="font-mono text-xs uppercase tracking-wider">Loading Archival Profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-dark-bg flex items-center justify-center p-6">
        <div className="card max-w-md p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-bronze-400 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">Profile Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The requested archival profile does not exist or may have been moved.
          </p>
          <Link to="/" className="btn btn-primary btn-md inline-block">
            Return to Main Archive
          </Link>
        </div>
      </div>
    )
  }

  const filteredArticles = articles.filter((art) => {
    if (articleFilter === 'published') return art.status === 'published'
    if (articleFilter === 'draft') return art.status === 'draft'
    return true
  })

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-dark-bg text-gray-900 dark:text-ivory-100 transition-colors pb-24">
      {/* ─── Hero Cover Banner ────────────────────────────────────────────── */}
      <div className="relative w-full h-48 sm:h-64 lg:h-80 overflow-hidden bg-charcoal-950">
        {profile.cover_url ? (
          <img
            src={profile.cover_url}
            alt="Profile cover banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-charcoal-950 via-charcoal-900 to-bronze-950/40 relative">
            <div className="absolute inset-0 bg-archival-grid opacity-30" />
            <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-bronze-500/10 blur-3xl pointer-events-none" />
          </div>
        )}

        {/* Change Cover button for profile owner */}
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('settings')}
            type="button"
            className="absolute top-4 right-4 bg-charcoal-900/80 hover:bg-charcoal-800 text-ivory-200 border border-ivory-100/15 backdrop-blur-md px-3 py-1.5 rounded-sm font-sans text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-bronze-400" />
            <span>Update Banner</span>
          </button>
        )}
      </div>

      {/* ─── Profile Header Info Bar ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 -mt-16 sm:-mt-20 relative z-10">
        <div className="card p-6 sm:p-8 bg-charcoal-900/95 backdrop-blur-xl border border-ivory-100/15 shadow-museum rounded-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Left Column: Avatar + Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar with gold border */}
              <div className="relative">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || profile.username}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-2 border-bronze-400/60 shadow-artifact"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-24 h-24 sm:w-28 sm:h-28 rounded-xl flex items-center justify-center text-white text-3xl font-display font-bold border-2 border-bronze-400/60 shadow-artifact',
                      getAvatarColor(profile.username)
                    )}
                  >
                    {getAvatarFallback(profile.full_name || profile.username)}
                  </div>
                )}

                {profile.is_verified && (
                  <div
                    className="absolute -bottom-1 -right-1 bg-bronze-400 text-charcoal-950 p-1.5 rounded-full shadow"
                    title="Verified Archival Contributor"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Names & Role Badges */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-ivory-100">
                    {profile.full_name || profile.username}
                  </h1>
                  {profile.role && (
                    <span className="font-mono text-2xs uppercase tracking-widest px-2.5 py-0.5 rounded bg-bronze-400/10 text-bronze-300 border border-bronze-400/40">
                      {profile.role}
                    </span>
                  )}
                </div>

                <p className="font-mono text-xs text-bronze-400">
                  @{profile.username}
                </p>

                {profile.bio && (
                  <p className="font-sans text-sm text-ivory-300 font-light max-w-xl leading-relaxed pt-1">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleShareProfile}
                type="button"
                className="p-2.5 bg-charcoal-800 hover:bg-charcoal-700 text-ivory-300 rounded border border-ivory-100/10 transition-colors"
                title="Share Archival Profile Link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setActiveTab('settings')}
                    type="button"
                    className="btn btn-ghost border border-ivory-100/15 text-ivory-200 hover:text-white btn-sm gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-bronze-400" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingArticleId(null)
                      setActiveTab('write')
                    }}
                    type="button"
                    className="btn btn-primary btn-sm gap-2 shadow-bronze-glow"
                  >
                    <Feather className="w-3.5 h-3.5" />
                    <span>Write Article</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toast.success(`Followed @${profile.username}`)}
                  type="button"
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Follow Scholar</span>
                </button>
              )}
            </div>
          </div>

          {/* Metadata Chips Row (Country, Website, Languages, Joined) */}
          <div className="mt-6 pt-5 border-t border-ivory-100/10 flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-ivory-400 font-mono">
            {profile.country && (
              <div className="flex items-center space-x-1.5 text-ivory-300">
                <MapPin className="w-3.5 h-3.5 text-bronze-400" />
                <span>{profile.country}</span>
              </div>
            )}

            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 text-bronze-400 hover:text-bronze-300 underline underline-offset-2 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{profile.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {profile.languages && profile.languages.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <span className="text-bronze-400">LANGUAGES:</span>
                <div className="flex flex-wrap gap-1">
                  {profile.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-0.5 rounded bg-charcoal-800 text-ivory-200 border border-ivory-100/5 text-[10px]"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-1.5 text-ivory-500 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>

        {/* ─── Advanced Metrics Bar ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="card p-4 bg-charcoal-900/90 border border-ivory-100/10 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded bg-bronze-400/10 border border-bronze-400/30 flex items-center justify-center text-bronze-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-ivory-100">
                {formatNumber(articles.length || profile.articles_count || 0)}
              </div>
              <div className="font-mono text-2xs uppercase tracking-wider text-ivory-400">
                Articles Written
              </div>
            </div>
          </div>

          <div className="card p-4 bg-charcoal-900/90 border border-ivory-100/10 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded bg-bronze-400/10 border border-bronze-400/30 flex items-center justify-center text-bronze-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-ivory-100">
                {formatNumber(profile.total_views || articles.reduce((acc, a) => acc + (a.views_count || 0), 0))}
              </div>
              <div className="font-mono text-2xs uppercase tracking-wider text-ivory-400">
                Total Reads
              </div>
            </div>
          </div>

          <div className="card p-4 bg-charcoal-900/90 border border-ivory-100/10 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded bg-bronze-400/10 border border-bronze-400/30 flex items-center justify-center text-bronze-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-ivory-100">
                {formatNumber(profile.followers_count || 0)}
              </div>
              <div className="font-mono text-2xs uppercase tracking-wider text-ivory-400">
                Followers
              </div>
            </div>
          </div>

          <div className="card p-4 bg-charcoal-900/90 border border-ivory-100/10 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded bg-bronze-400/10 border border-bronze-400/30 flex items-center justify-center text-bronze-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-ivory-100">
                {formatNumber(profile.following_count || 0)}
              </div>
              <div className="font-mono text-2xs uppercase tracking-wider text-ivory-400">
                Following
              </div>
            </div>
          </div>
        </div>

        {/* ─── Profile Navigation Tabs ─────────────────────────────────────── */}
        <div className="mt-8 border-b border-ivory-100/10 flex items-center space-x-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('articles')}
            type="button"
            className={cn(
              'flex items-center space-x-2 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-colors',
              activeTab === 'articles'
                ? 'border-bronze-400 text-bronze-400 font-bold'
                : 'border-transparent text-ivory-400 hover:text-ivory-200'
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>Articles ({articles.length})</span>
          </button>

          {isOwnProfile && (
            <button
              onClick={() => {
                setEditingArticleId(null)
                setActiveTab('write')
              }}
              type="button"
              className={cn(
                'flex items-center space-x-2 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-colors',
                activeTab === 'write'
                  ? 'border-bronze-400 text-bronze-400 font-bold'
                  : 'border-transparent text-ivory-400 hover:text-ivory-200'
              )}
            >
              <Feather className="w-4 h-4" />
              <span>{editingArticleId ? 'Edit Article' : 'Write Article'}</span>
            </button>
          )}

          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              type="button"
              className={cn(
                'flex items-center space-x-2 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-colors',
                activeTab === 'saved'
                  ? 'border-bronze-400 text-bronze-400 font-bold'
                  : 'border-transparent text-ivory-400 hover:text-ivory-200'
              )}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Heritage ({bookmarks.length})</span>
            </button>
          )}

          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('settings')}
              type="button"
              className={cn(
                'flex items-center space-x-2 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-colors',
                activeTab === 'settings'
                  ? 'border-bronze-400 text-bronze-400 font-bold'
                  : 'border-transparent text-ivory-400 hover:text-ivory-200'
              )}
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* ─── TAB CONTENT: ARTICLES ───────────────────────────────────────── */}
        {activeTab === 'articles' && (
          <div className="mt-8 space-y-6">
            {/* Filter pills if viewing own profile */}
            {isOwnProfile && articles.length > 0 && (
              <div className="flex items-center space-x-2">
                {(['all', 'published', 'draft'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setArticleFilter(filter)}
                    type="button"
                    className={cn(
                      'font-mono text-2xs uppercase tracking-wider px-3 py-1.5 rounded transition-all',
                      articleFilter === filter
                        ? 'bg-bronze-400 text-charcoal-950 font-bold'
                        : 'bg-charcoal-850 text-ivory-300 border border-ivory-100/10 hover:border-bronze-400/40'
                    )}
                  >
                    {filter === 'all' ? 'All Articles' : filter === 'published' ? 'Published' : 'Drafts'}
                  </button>
                ))}
              </div>
            )}

            {loadingArticles ? (
              <div className="py-12 text-center text-ivory-400 font-mono text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-bronze-400" />
                Loading published works...
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    className="card bg-charcoal-900 border border-ivory-100/10 rounded-lg overflow-hidden flex flex-col justify-between group hover:border-bronze-400/40 transition-all shadow-museum"
                  >
                    <div>
                      {art.cover_image && (
                        <div className="aspect-[16/9] w-full overflow-hidden bg-charcoal-950">
                          <img
                            src={art.cover_image}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}

                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          {art.category ? (
                            <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
                              {art.category.name}
                            </span>
                          ) : (
                            <span className="font-mono text-2xs text-ivory-400">GENERAL RESEARCH</span>
                          )}

                          {isOwnProfile && (
                            <span
                              className={cn(
                                'font-mono text-[9px] uppercase px-2 py-0.5 rounded font-bold',
                                art.status === 'published'
                                  ? 'bg-green-950/60 text-green-300 border border-green-500/30'
                                  : 'bg-yellow-950/60 text-yellow-300 border border-yellow-500/30'
                              )}
                            >
                              {art.status}
                            </span>
                          )}
                        </div>

                        <h3 className="font-display font-semibold text-lg text-ivory-100 group-hover:text-bronze-300 transition-colors line-clamp-2">
                          {art.title}
                        </h3>

                        {art.excerpt && (
                          <p className="font-sans text-xs text-ivory-300 font-light line-clamp-2 leading-relaxed">
                            {art.excerpt}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0 mt-auto border-t border-ivory-100/5 flex items-center justify-between text-2xs font-mono text-ivory-400">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-bronze-400" />
                          {art.reading_time || 1}m read
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-bronze-400" />
                          {art.views_count || 0}
                        </span>
                      </div>

                      {isOwnProfile && (
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleStartEditArticle(art)}
                            className="p-1.5 hover:text-bronze-300 text-ivory-400 rounded transition-colors"
                            title="Edit Article"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-1.5 hover:text-red-400 text-ivory-400 rounded transition-colors"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-12 text-center bg-charcoal-900 border border-ivory-100/10 rounded-lg space-y-4">
                <BookOpen className="w-10 h-10 text-bronze-400/60 mx-auto" />
                <h3 className="font-display font-semibold text-xl text-ivory-100">
                  No Articles Published Yet
                </h3>
                <p className="font-sans text-sm text-ivory-400 max-w-md mx-auto">
                  {isOwnProfile
                    ? 'Start documenting African history, civilizational traditions, and scholarly insights.'
                    : `@${profile.username} has not published any public research articles yet.`}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab('write')}
                    className="btn btn-primary btn-md inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Write Your First Article</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: WRITE ARTICLE ──────────────────────────────────── */}
        {activeTab === 'write' && isOwnProfile && (
          <div className="mt-8 card p-6 sm:p-10 bg-charcoal-900 border border-ivory-100/15 shadow-museum rounded-lg space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ivory-100/10 pb-6 gap-4">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
                  ARCHIVAL PUBLISHING DESK
                </span>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-ivory-100 mt-0.5">
                  {editingArticleId ? 'Edit Article' : 'Write a New Article'}
                </h2>
                <p className="font-sans text-xs text-ivory-400 mt-1">
                  Contribute peer-verified articles, oral analyses, and civilizational research to AfroArchive.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveArticle('draft')}
                  disabled={isSubmittingArticle}
                  className="btn btn-ghost border border-ivory-100/20 text-ivory-200 hover:text-white btn-sm"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveArticle('published')}
                  disabled={isSubmittingArticle}
                  className="btn btn-primary btn-sm gap-2 shadow-bronze-glow"
                >
                  {isSubmittingArticle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Feather className="w-4 h-4" />}
                  <span>{editingArticleId ? 'Update & Publish' : 'Publish Article'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                  placeholder="e.g. The Mathematical Treatises of 14th Century Timbuktu"
                  className="w-full bg-charcoal-950 text-ivory-100 font-display text-xl sm:text-2xl px-5 py-4 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none placeholder:text-ivory-600"
                />
              </div>

              {/* Cover Image URL + Preview */}
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Cover Image URL (Direct image or Wikimedia link)
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={writeCoverImage}
                    onChange={(e) => setWriteCoverImage(e.target.value)}
                    placeholder="https://upload.wikimedia.org/.../artifact.jpg"
                    className="flex-1 bg-charcoal-950 text-ivory-100 font-mono text-xs px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                  />
                  {writeCoverImage && (
                    <div className="w-14 h-11 rounded overflow-hidden border border-ivory-100/20 bg-charcoal-950 flex-shrink-0">
                      <img
                        src={writeCoverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={() => toast.error('Could not load image URL')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Category & Time Period & Country Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                    Category
                  </label>
                  <select
                    value={writeCategoryId}
                    onChange={(e) => setWriteCategoryId(e.target.value)}
                    className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                  >
                    <option value="">Select Archival Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                    Historical Time Period
                  </label>
                  <input
                    type="text"
                    value={writeTimePeriod}
                    onChange={(e) => setWriteTimePeriod(e.target.value)}
                    placeholder="e.g. 13th–15th Century CE"
                    className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                    Country / Geographic Focus
                  </label>
                  <input
                    type="text"
                    value={writeCountry}
                    onChange={(e) => setWriteCountry(e.target.value)}
                    placeholder="e.g. Mali, West Africa"
                    className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Short Excerpt */}
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Short Editorial Excerpt (1-2 sentences)
                </label>
                <textarea
                  rows={2}
                  value={writeExcerpt}
                  onChange={(e) => setWriteExcerpt(e.target.value)}
                  placeholder="A concise overview of the core historical thesis or civilizational event explored in this article..."
                  className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Main Content Area */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-mono text-2xs uppercase tracking-wider text-ivory-300">
                    Article Body Content *
                  </label>
                  <span className="font-mono text-2xs text-ivory-500">
                    {calculateReadingTime(writeContent)}m reading time · {writeContent.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={14}
                  required
                  value={writeContent}
                  onChange={(e) => setWriteContent(e.target.value)}
                  placeholder="Write your research article here. Document primary sources, archaeological discoveries, and oral historical lineages..."
                  className="w-full bg-charcoal-950 text-ivory-100 font-sans text-sm p-5 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none leading-relaxed font-light"
                />
              </div>

              {/* Citations & Primary Sources References */}
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Archival Citations & Primary Sources (one per line)
                </label>
                <textarea
                  rows={3}
                  value={writeReferences}
                  onChange={(e) => setWriteReferences(e.target.value)}
                  placeholder="• Ahmed Baba Institute Manuscript Collection, Ref #MS-429&#10;• Tarikh al-Sudan, Abd al-Sadi (1655)&#10;• UNESCO World Heritage Inscription Data"
                  className="w-full bg-charcoal-950 text-ivory-100 font-mono text-xs p-4 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-ivory-100/10">
                <button
                  type="button"
                  onClick={() => handleSaveArticle('draft')}
                  disabled={isSubmittingArticle}
                  className="px-6 py-3 bg-charcoal-800 text-ivory-200 border border-ivory-100/15 hover:border-bronze-400/40 rounded font-sans text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveArticle('published')}
                  disabled={isSubmittingArticle}
                  className="px-8 py-3 bg-bronze-400 text-charcoal-950 hover:bg-bronze-300 rounded font-sans text-xs font-semibold uppercase tracking-wider shadow-bronze-glow transition-colors flex items-center space-x-2"
                >
                  {isSubmittingArticle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Feather className="w-4 h-4" />}
                  <span>{editingArticleId ? 'Update & Publish' : 'Publish Article Live'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: SAVED HERITAGE ─────────────────────────────────── */}
        {activeTab === 'saved' && isOwnProfile && (
          <div className="mt-8 space-y-6">
            {bookmarks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="card p-5 bg-charcoal-900 border border-ivory-100/10 rounded-lg flex flex-col justify-between space-y-4 shadow-museum"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-2xs uppercase tracking-wider text-bronze-400">
                          {bm.type.toUpperCase()}
                        </span>
                        <button
                          onClick={() => removeBookmark(bm.id)}
                          className="text-ivory-500 hover:text-red-400 transition-colors p-1"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-display font-semibold text-base text-ivory-100 line-clamp-2">
                        {bm.title}
                      </h4>

                      <p className="font-sans text-xs text-ivory-400 line-clamp-2">
                        {bm.subtitle}
                      </p>
                    </div>

                    <Link
                      to="/museum"
                      className="btn btn-ghost border border-ivory-100/10 hover:border-bronze-400 text-xs w-full text-center py-2"
                    >
                      Inspect in Museum →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-12 text-center bg-charcoal-900 border border-ivory-100/10 rounded-lg space-y-4">
                <Bookmark className="w-10 h-10 text-bronze-400/60 mx-auto" />
                <h3 className="font-display font-semibold text-xl text-ivory-100">
                  No Saved Heritage Items
                </h3>
                <p className="font-sans text-sm text-ivory-400 max-w-md mx-auto">
                  As you explore the museum exhibition and archival collections, bookmark artifacts to study them here.
                </p>
                <Link to="/museum" className="btn btn-primary btn-md inline-block">
                  Explore Museum Exhibition
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: EDIT PROFILE SETTINGS ───────────────────────────── */}
        {activeTab === 'settings' && isOwnProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-8 card p-6 sm:p-10 bg-charcoal-900 border border-ivory-100/15 shadow-museum rounded-lg space-y-6"
          >
            <div className="border-b border-ivory-100/10 pb-4">
              <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
                SCHOLAR PROFILE CONFIGURATION
              </span>
              <h2 className="font-display font-bold text-2xl text-ivory-100 mt-0.5">
                Edit Archival Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="e.g. Cheikh Anta Diop"
                  className="w-full bg-charcoal-950 text-ivory-100 font-sans text-sm px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Username (@handle)
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="scholar_username"
                  className="w-full bg-charcoal-950 text-ivory-100 font-sans text-sm px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                Scholar Bio & Academic Focus
              </label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Historian and researcher of West African manuscripts, pre-colonial trade routes, and indigenous metallurgy..."
                className="w-full bg-charcoal-950 text-ivory-100 font-sans text-sm px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Country & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Country / Region
                </label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  placeholder="e.g. Senegal / West Africa"
                  className="w-full bg-charcoal-950 text-ivory-100 font-sans text-sm px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Website / Portfolio
                </label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://africanstudies.org/researcher"
                  className="w-full bg-charcoal-950 text-ivory-100 font-sans text-sm px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                Languages (comma separated)
              </label>
              <input
                type="text"
                value={editLanguages}
                onChange={(e) => setEditLanguages(e.target.value)}
                placeholder="e.g. Swahili, Yoruba, French, Arabic, English"
                className="w-full bg-charcoal-950 text-ivory-100 font-sans text-sm px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
              />
            </div>

            {/* Avatar & Cover URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://.../avatar.jpg"
                  className="w-full bg-charcoal-950 text-ivory-100 font-mono text-xs px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-2xs uppercase tracking-wider text-ivory-300 mb-2">
                  Banner Cover Image URL
                </label>
                <input
                  type="url"
                  value={editCoverUrl}
                  onChange={(e) => setEditCoverUrl(e.target.value)}
                  placeholder="https://.../banner.jpg"
                  className="w-full bg-charcoal-950 text-ivory-100 font-mono text-xs px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-ivory-100/10">
              <button
                type="button"
                onClick={() => signOut()}
                className="text-red-400 hover:text-red-300 font-mono text-xs"
              >
                Sign Out of Account
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('articles')}
                  className="btn btn-ghost border border-ivory-100/10 text-ivory-300 btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn btn-primary btn-md gap-2"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
