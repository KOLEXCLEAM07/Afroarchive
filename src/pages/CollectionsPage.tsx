import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import {
  Layers, Plus, Search, Loader2, Sparkles, BookOpen,
  ArrowRight, FolderPlus, Globe, Lock, Check, X, ShieldCheck
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn, slugify } from '@/lib/utils'
import type { Collection } from '@/types'
import toast from 'react-hot-toast'

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

interface PresetCollection {
  title: string
  icon: string
  slug: string
  category: string
  articlesCount: number
  description: string
  accentColor: string
}

const PRESET_COLLECTIONS: PresetCollection[] = [
  {
    title: 'African Philosophy & Ethics',
    icon: '🧠',
    slug: 'philosophy',
    category: 'philosophy',
    articlesCount: 245,
    description: 'Ubuntu, Maat, Ujamaa, and the epistemological systems of African moral thought.',
    accentColor: 'from-emerald-600/20 to-emerald-900/30',
  },
  {
    title: 'Great Empires & Kingdoms',
    icon: '👑',
    slug: 'history',
    category: 'history',
    articlesCount: 530,
    description: 'Mali, Songhai, Kush, Axum, Great Zimbabwe — explore Africa’s greatest sovereign dynasties.',
    accentColor: 'from-amber-600/20 to-amber-900/30',
  },
  {
    title: 'Indigenous Science & Astronomy',
    icon: '🔭',
    slug: 'science',
    category: 'science',
    articlesCount: 195,
    description: 'Dogon celestial mechanics, Egyptian mathematics, Sahelian navigation, and African metallurgy.',
    accentColor: 'from-blue-600/20 to-blue-900/30',
  },
  {
    title: 'Oral Traditions & Griots',
    icon: '🗣️',
    slug: 'languages',
    category: 'languages',
    articlesCount: 312,
    description: 'Centuries of oral epics, Sundiata Keita praise poetry, and indigenous linguistic wisdom.',
    accentColor: 'from-purple-600/20 to-purple-900/30',
  },
  {
    title: 'Sacred Architecture & Megaliths',
    icon: '🏛️',
    slug: 'architecture',
    category: 'architecture',
    articlesCount: 98,
    description: 'From the Nubian Pyramids and Axum Stelae to the mortarless drystone masonry of Great Zimbabwe.',
    accentColor: 'from-rose-600/20 to-rose-900/30',
  },
  {
    title: 'Classical Arts & Sculpture',
    icon: '🏺',
    slug: 'arts',
    category: 'arts',
    articlesCount: 280,
    description: 'The lost-wax bronzes of Benin, Nok terracotta, Ife bronze portraiture, and royal regalia.',
    accentColor: 'from-orange-600/20 to-orange-900/30',
  },
  {
    title: 'Cosmology & Spiritual Traditions',
    icon: '🌙',
    slug: 'religion',
    category: 'philosophy',
    articlesCount: 164,
    description: 'Yoruba Ifa divination, Akan cosmologies, and traditional systems of ecological veneration.',
    accentColor: 'from-teal-600/20 to-teal-900/30',
  },
  {
    title: 'Pan-African Political Thought',
    icon: '⚖️',
    slug: 'politics',
    category: 'history',
    articlesCount: 176,
    description: 'Nkrumah, Fanon, Biko, and modern anti-colonial movements for continental unification.',
    accentColor: 'from-red-600/20 to-red-900/30',
  },
  {
    title: 'Traditional Medicine & Healing',
    icon: '🌿',
    slug: 'medicine',
    category: 'science',
    articlesCount: 120,
    description: 'Ethnobotany, herbal pharmacology, holistic healing philosophies, and bone-setting techniques.',
    accentColor: 'from-green-600/20 to-green-900/30',
  },
  {
    title: 'Trade Routes & Economics',
    icon: '💰',
    slug: 'economics',
    category: 'history',
    articlesCount: 140,
    description: 'Trans-Saharan caravan trails, Indian Ocean maritime trade, and cowrie currency systems.',
    accentColor: 'from-yellow-600/20 to-yellow-900/30',
  },
  {
    title: 'Agriculture & Food Cultures',
    icon: '🌾',
    slug: 'agriculture',
    category: 'science',
    articlesCount: 88,
    description: 'Indigenous sorghum, millet domestication, yam festivals, and sustainable terracing systems.',
    accentColor: 'from-lime-600/20 to-lime-900/30',
  },
  {
    title: 'African Literature & Poetry',
    icon: '📖',
    slug: 'literature',
    category: 'languages',
    articlesCount: 220,
    description: 'From classical manuscripts to modern masterpieces by Achebe, Soyinka, and Ngũgĩ.',
    accentColor: 'from-indigo-600/20 to-indigo-900/30',
  },
]

const CATEGORY_TABS = [
  { label: 'All Collections', key: 'all' },
  { label: 'Philosophy', key: 'philosophy' },
  { label: 'History & Dynasties', key: 'history' },
  { label: 'Indigenous Science', key: 'science' },
  { label: 'Arts & Culture', key: 'arts' },
  { label: 'Oral Traditions', key: 'languages' },
  { label: 'Architecture', key: 'architecture' },
]

export default function CollectionsPage() {
  const { user } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  // Create Collection Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [colTitle, setColTitle] = useState('')
  const [colDescription, setColDescription] = useState('')
  const [colCoverImage, setColCoverImage] = useState('')
  const [colIsPublic, setColIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadCollections() {
      try {
        const { data } = await supabase
          .from('collections')
          .select('*, owner:profiles!collections_owner_id_fkey(*)')
          .eq('is_public', true)
          .order('articles_count', { ascending: false })
          .limit(20)
        setCollections((data as Collection[]) ?? [])
      } catch {
        // quiet fallback
      } finally {
        setLoading(false)
      }
    }
    loadCollections()
  }, [])

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to create a collection')
      return
    }
    if (!colTitle.trim()) {
      toast.error('Please enter a collection title')
      return
    }

    setIsSubmitting(true)
    try {
      const slug = slugify(colTitle) + '-' + Math.random().toString(36).substring(2, 6)
      const { data, error } = await supabase
        .from('collections')
        .insert({
          owner_id: user.id,
          title: colTitle.trim(),
          slug,
          description: colDescription.trim() || null,
          cover_image: colCoverImage.trim() || null,
          is_public: colIsPublic,
          articles_count: 0,
        })
        .select('*, owner:profiles!collections_owner_id_fkey(*)')
        .single()

      if (error) throw error

      if (data) {
        setCollections(prev => [data as Collection, ...prev])
      }
      toast.success('Collection created successfully!')
      setIsModalOpen(false)
      setColTitle('')
      setColDescription('')
      setColCoverImage('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create collection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredPresets = PRESET_COLLECTIONS.filter(col => {
    const matchesSearch = !search ||
      col.title.toLowerCase().includes(search.toLowerCase()) ||
      col.description.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = activeCategory === 'all' || col.category === activeCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors py-10">
      <div className="container-app">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-primary font-mono text-2xs tracking-widest uppercase">
                CURATED ARCHIVES & ANTHOLOGIES
              </span>
              <span className="text-xs text-gray-400 font-mono">
                12 SCHOLARLY THEMES
              </span>
            </div>
            <h1 className="heading-xl text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-2">
              Knowledge Collections
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
              Explore meticulously curated anthologies of African scholarship, classical manuscripts, and civilizational achievements categorized by theme.
            </p>
          </div>

          <button
            onClick={() => {
              if (!user) {
                toast.error('Please sign in to create a custom anthology')
              } else {
                setIsModalOpen(true)
              }
            }}
            className="btn btn-primary btn-md gap-2 flex-shrink-0 self-start md:self-auto shadow-sm"
            id="collections-create-btn"
          >
            <Plus className="w-4 h-4" />
            <span>New Collection</span>
          </button>
        </motion.div>

        {/* Search & Category Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-8">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search collections and topics…"
              className="input pl-10 bg-white dark:bg-dark-surface shadow-xs"
              id="collections-search"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={cn(
                  'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors border',
                  activeCategory === tab.key
                    ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                    : 'bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 border-sand-200 dark:border-dark-border hover:border-primary-400'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Collections Grid */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-primary-500 rounded-full" />
              <h2 className="heading-md text-xl sm:text-2xl text-gray-900 dark:text-white">
                Archival Anthologies
              </h2>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              {filteredPresets.length} collections
            </span>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredPresets.map(col => (
              <motion.div key={col.slug} variants={fadeUp}>
                <Link
                  to={`/discover?category=${col.slug}`}
                  className="card-hover p-6 group flex flex-col justify-between h-full bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-primary-500/50"
                  id={`collection-${col.slug}`}
                >
                  <div className={cn('absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-50 blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none', col.accentColor)} />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-sand-100 dark:bg-dark-card border border-sand-200 dark:border-dark-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                        {col.icon}
                      </div>
                      <span className="text-2xs font-mono font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-full border border-primary-200 dark:border-primary-900/40">
                        {col.articlesCount} items
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                      {col.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                      {col.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-sand-200 dark:border-dark-border flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400 group-hover:text-primary-700 transition-colors">
                    <span>Explore Anthology</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Community Curated Collections Section */}
        <section className="pt-8 border-t border-sand-200 dark:border-dark-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-accent-500 rounded-full" />
              <h2 className="heading-md text-xl sm:text-2xl text-gray-900 dark:text-white">
                Community Collections
              </h2>
            </div>
            {collections.length > 0 && (
              <span className="text-xs text-gray-500 font-mono">
                {collections.length} published
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : collections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map(col => (
                <Link
                  key={col.id}
                  to={`/discover?category=${col.slug}`}
                  className="card-hover overflow-hidden group bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border rounded-2xl"
                >
                  {col.cover_image ? (
                    <img
                      src={col.cover_image}
                      alt={col.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-44 animated-gradient opacity-90 flex items-center justify-center">
                      <Layers className="w-12 h-12 text-white/40" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1.5">
                      {col.title}
                    </h3>
                    {col.description && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                        {col.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono pt-3 border-t border-sand-200 dark:border-dark-border">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        @{col.owner?.username || 'scholar'}
                      </span>
                      <span>{col.articles_count} manuscripts</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center max-w-xl mx-auto bg-white dark:bg-dark-surface">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-900/40 flex items-center justify-center">
                <FolderPlus className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="heading-sm text-lg text-gray-900 dark:text-white mb-2">
                Curate the First Community Anthology
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Organize manuscripts and scholarly discoveries into your own themed anthology to share with historians and students worldwide.
              </p>
              <button
                onClick={() => {
                  if (!user) toast.error('Please sign in to create a collection')
                  else setIsModalOpen(true)
                }}
                className="btn btn-outline btn-md gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create an Anthology</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Create Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 sm:p-8 max-w-lg w-full bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border shadow-museum relative"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="heading-sm text-xl text-gray-900 dark:text-white">
                  Create Knowledge Collection
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Curate and organize related manuscripts into a public anthology
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1 font-mono">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  value={colTitle}
                  onChange={e => setColTitle(e.target.value)}
                  placeholder="e.g. Swahili Coast Maritime Heritage"
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1 font-mono">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={colDescription}
                  onChange={e => setColDescription(e.target.value)}
                  placeholder="Describe the historical scope and focus of this anthology..."
                  className="input text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1 font-mono">
                  Cover Image URL (optional)
                </label>
                <input
                  type="url"
                  value={colCoverImage}
                  onChange={e => setColCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="input text-sm font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={colIsPublic}
                    onChange={e => setColIsPublic(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Make collection publicly visible to scholars</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-200 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Publish Collection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
