import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { Layers, Plus, Search, Loader2, ArrowRight, FolderPlus, Check, X, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { normalizeUrl } from '@/lib/query'
import ImageUpload from '@/components/ui/ImageUpload'
import { cn, uniqueSlug } from '@/lib/utils'
import type { Collection } from '@/types'
import toast from 'react-hot-toast'

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }

interface Theme {
  title: string
  icon: string
  group: 'philosophy' | 'history' | 'science' | 'arts' | 'languages'
  to: string
  description: string
  accentColor: string
}

// Editorial reading paths into the archive. Each links to a category or a search.
const THEMES: Theme[] = [
  { title: 'African Philosophy & Ethics', icon: '🧠', group: 'philosophy', to: '/discover?category=philosophy', description: 'Ubuntu, Maat, Ujamaa and the moral and epistemological traditions of African thought.', accentColor: 'from-emerald-600/20 to-emerald-900/30' },
  { title: 'Empires & Kingdoms', icon: '👑', group: 'history', to: '/discover?category=history', description: 'Mali, Songhay, Kush, Aksum, Great Zimbabwe and the states that shaped the continent.', accentColor: 'from-amber-600/20 to-amber-900/30' },
  { title: 'Indigenous Science & Astronomy', icon: '🔭', group: 'science', to: '/discover?category=science', description: 'Astronomy, mathematics, metallurgy and the scholarly traditions behind them.', accentColor: 'from-blue-600/20 to-blue-900/30' },
  { title: 'Languages, Scripts & Oral Tradition', icon: '🗣️', group: 'languages', to: '/discover?category=languages', description: 'Griots and epics, Ajami and Ge’ez, Nsibidi and the languages that carry memory.', accentColor: 'from-purple-600/20 to-purple-900/30' },
  { title: 'Architecture & Monuments', icon: '🏛️', group: 'history', to: '/discover?q=architecture', description: 'Nubian pyramids, the stelae of Aksum, Djenné’s mosque and the walls of Great Zimbabwe.', accentColor: 'from-rose-600/20 to-rose-900/30' },
  { title: 'Sculpture & Metalwork', icon: '🏺', group: 'arts', to: '/discover?category=art-culture', description: 'Benin brass, Nok terracotta, Ife heads and royal regalia.', accentColor: 'from-orange-600/20 to-orange-900/30' },
  { title: 'Cosmology & Spiritual Traditions', icon: '🌙', group: 'philosophy', to: '/discover?q=cosmology', description: 'Ifá, Akan cosmologies and the ways communities have understood the world.', accentColor: 'from-teal-600/20 to-teal-900/30' },
  { title: 'Pan-African Political Thought', icon: '⚖️', group: 'history', to: '/discover?q=Pan-African', description: 'Nkrumah, Fanon, Biko and the movements for independence and unity.', accentColor: 'from-red-600/20 to-red-900/30' },
  { title: 'Medicine & Healing', icon: '🌿', group: 'science', to: '/discover?q=medicine', description: 'Ethnobotany, healing practices and the knowledge of plants.', accentColor: 'from-green-600/20 to-green-900/30' },
  { title: 'Trade Routes & Economies', icon: '🐪', group: 'history', to: '/discover?q=trade', description: 'Trans-Saharan caravans, the Swahili coast and Indian Ocean commerce.', accentColor: 'from-yellow-600/20 to-yellow-900/30' },
  { title: 'Agriculture & Food', icon: '🌾', group: 'science', to: '/discover?q=agriculture', description: 'The domestication of sorghum, millet and yams, and the farming systems around them.', accentColor: 'from-lime-600/20 to-lime-900/30' },
  { title: 'Literature & Poetry', icon: '📖', group: 'languages', to: '/discover?q=literature', description: 'From classical manuscripts to Achebe, Soyinka and Ngũgĩ.', accentColor: 'from-indigo-600/20 to-indigo-900/30' },
]

const GROUP_TABS = [
  { label: 'All', key: 'all' },
  { label: 'Philosophy', key: 'philosophy' },
  { label: 'History', key: 'history' },
  { label: 'Science', key: 'science' },
  { label: 'Arts', key: 'arts' },
  { label: 'Languages', key: 'languages' },
] as const

export default function CollectionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  useDocumentTitle('Collections')

  const [communityCollections, setCommunityCollections] = useState<Collection[]>([])
  const [myCollections, setMyCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState<string>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [colTitle, setColTitle] = useState('')
  const [colDescription, setColDescription] = useState('')
  const [colCoverImage, setColCoverImage] = useState('')
  const [colIsPublic, setColIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    supabase
      .from('collections')
      .select('*, owner:profiles!collections_owner_id_fkey(*)')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(24)
      .then(({ data }) => {
        setCommunityCollections((data as Collection[]) ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!user) { setMyCollections([]); return }
    supabase.from('collections').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false })
      .then(({ data }) => setMyCollections((data as Collection[]) ?? []))
  }, [user])

  const openCreate = () => {
    if (!user) {
      toast('Sign in to create a collection')
      navigate('/auth/login', { state: { from: '/collections?new=1' } })
      return
    }
    setIsModalOpen(true)
  }

  // "New collection" links from elsewhere open the dialog directly.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSearchParams({}, { replace: true })
      openCreate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.key])

  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsModalOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isModalOpen])

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const title = colTitle.trim()
    if (title.length < 3 || title.length > 120) { toast.error('Title must be between 3 and 120 characters.'); return }
    const cover = colCoverImage.trim() ? normalizeUrl(colCoverImage, { httpsOnly: true }) : null
    if (colCoverImage.trim() && !cover) { toast.error('Cover image must be a secure https:// link.'); return }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          owner_id: user.id,
          title,
          slug: uniqueSlug(title),
          description: colDescription.trim() || null,
          cover_image: cover,
          is_public: colIsPublic,
        })
        .select('*')
        .single()
      if (error) throw error

      const created = data as Collection
      setMyCollections(prev => [created, ...prev])
      toast.success('Collection created')
      setIsModalOpen(false)
      setColTitle(''); setColDescription(''); setColCoverImage(''); setColIsPublic(true)
      navigate(`/collections/${created.slug}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not create the collection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const needle = search.trim().toLowerCase()
  const filteredThemes = THEMES.filter(t =>
    (!needle || t.title.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle)) &&
    (activeGroup === 'all' || t.group === activeGroup)
  )
  const filteredCommunity = communityCollections.filter(c =>
    !needle || c.title.toLowerCase().includes(needle) || c.description?.toLowerCase().includes(needle)
  )

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors py-10">
      <div className="container-app">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="heading-xl text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-2">Collections</h1>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
              Follow a theme through the archive, or browse reading lists curated by members.
            </p>
          </div>
          <button type="button" onClick={openCreate} className="btn btn-primary btn-md gap-2 flex-shrink-0 self-start md:self-auto shadow-sm" id="collections-create-btn">
            <Plus className="w-4 h-4" />
            <span>New collection</span>
          </button>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-8">
          <div className="relative max-w-md w-full">
            <label htmlFor="collections-search" className="sr-only">Search collections</label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              id="collections-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search themes and collections…"
              className="input pl-10 bg-white dark:bg-dark-surface shadow-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1" role="group" aria-label="Filter themes">
            {GROUP_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={activeGroup === tab.key}
                onClick={() => setActiveGroup(tab.key)}
                className={cn(
                  'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors border',
                  activeGroup === tab.key
                    ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                    : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 border-sand-200 dark:border-dark-border hover:border-primary-400'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {user && myCollections.length > 0 && (
          <section className="mb-14" aria-labelledby="my-collections">
            <SectionTitle id="my-collections" title="Your collections" count={myCollections.length} accent="bg-accent-500" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {myCollections.map(col => (
                <Link key={col.id} to={`/collections/${col.slug}`} className="card-hover p-5 bg-white dark:bg-dark-surface rounded-2xl border border-sand-200 dark:border-dark-border">
                  <div className="flex items-center justify-between mb-2">
                    <Layers className="w-5 h-5 text-primary-500" />
                    {!col.is_public && <span className="inline-flex items-center gap-1 text-2xs text-gray-400"><Lock className="w-3 h-3" /> Private</span>}
                  </div>
                  <h3 className="font-serif font-bold text-gray-900 dark:text-white line-clamp-2">{col.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{col.articles_count || 0} article{col.articles_count === 1 ? '' : 's'}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-14" aria-labelledby="themes">
          <SectionTitle id="themes" title="Themes" count={filteredThemes.length} accent="bg-primary-500" />
          {filteredThemes.length === 0 ? (
            <p className="text-sm text-gray-500">No themes match “{search}”.</p>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredThemes.map(theme => (
                <motion.div key={theme.title} variants={fadeUp}>
                  <Link
                    to={theme.to}
                    className="card-hover p-6 group flex flex-col justify-between h-full bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-primary-500/50"
                  >
                    <div className={cn('absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-50 blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none', theme.accentColor)} aria-hidden="true" />
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-sand-100 dark:bg-dark-card border border-sand-200 dark:border-dark-border flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                        {theme.icon}
                      </div>
                      <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">{theme.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{theme.description}</p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-sand-200 dark:border-dark-border flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        <section className="pt-8 border-t border-sand-200 dark:border-dark-border" aria-labelledby="community">
          <SectionTitle id="community" title="Curated by members" count={filteredCommunity.length} accent="bg-accent-500" />
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
          ) : filteredCommunity.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunity.map(col => (
                <Link key={col.id} to={`/collections/${col.slug}`} className="card-hover overflow-hidden group bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border rounded-2xl">
                  {col.cover_image ? (
                    <img src={col.cover_image} alt="" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-44 animated-gradient opacity-90 flex items-center justify-center"><Layers className="w-12 h-12 text-white/40" /></div>
                  )}
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1.5">{col.title}</h3>
                    {col.description && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">{col.description}</p>}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-sand-200 dark:border-dark-border">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">{col.owner?.username ? `@${col.owner.username}` : 'Member'}</span>
                      <span>{col.articles_count || 0} article{col.articles_count === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center max-w-xl mx-auto bg-white dark:bg-dark-surface">
              <FolderPlus className="w-10 h-10 mx-auto mb-4 text-primary-600 dark:text-primary-400" />
              <h3 className="heading-sm text-lg text-gray-900 dark:text-white mb-2">No member collections yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Gather articles into a reading list on a topic you care about and share it with others.
              </p>
              <button type="button" onClick={openCreate} className="btn btn-outline btn-md gap-2">
                <Plus className="w-4 h-4" /><span>Start a collection</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onMouseDown={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-collection-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 sm:p-8 max-w-lg w-full bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border shadow-museum relative"
          >
            <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Close" className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
              <X className="w-5 h-5" />
            </button>
            <h2 id="new-collection-title" className="heading-sm text-xl text-gray-900 dark:text-white mb-1">New collection</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Group articles into a reading list. You can add articles from any article page.</p>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label htmlFor="col-title" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Title *</label>
                <input id="col-title" type="text" required autoFocus minLength={3} maxLength={120} value={colTitle} onChange={e => setColTitle(e.target.value)} placeholder="e.g. Swahili Coast maritime heritage" className="input text-sm" />
              </div>
              <div>
                <label htmlFor="col-desc" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Description</label>
                <textarea id="col-desc" rows={3} maxLength={500} value={colDescription} onChange={e => setColDescription(e.target.value)} placeholder="What ties these articles together?" className="input text-sm resize-none" />
              </div>
              <ImageUpload label="Cover image (optional)" value={colCoverImage} onChange={setColCoverImage} bucket="collection-covers" maxDimension={1400} previewClassName="w-24 h-16" />
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-300 pt-2">
                <input type="checkbox" checked={colIsPublic} onChange={e => setColIsPublic(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500" />
                <span>Visible to everyone</span>
              </label>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-200 dark:border-dark-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating…</span></> : <><Check className="w-4 h-4" /><span>Create collection</span></>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ id, title, count, accent }: { id: string; title: string; count: number; accent: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className={cn('w-6 h-1 rounded-full', accent)} aria-hidden="true" />
        <h2 id={id} className="heading-md text-xl sm:text-2xl text-gray-900 dark:text-white">{title}</h2>
      </div>
      <span className="text-xs text-gray-500">{count}</span>
    </div>
  )
}
