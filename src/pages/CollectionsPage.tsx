import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Plus, Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import type { Collection } from '@/types'

const PRESET_COLLECTIONS = [
  { title: 'African Philosophy',   icon: '🧠', slug: 'philosophy',    description: 'Ubuntu, Maat, Ujamaa, and the deep philosophical traditions of the African continent.' },
  { title: 'Great Empires',        icon: '👑', slug: 'history',       description: 'Mali, Songhai, Kush, Axum, Zimbabwe — explore Africa\'s greatest kingdoms and empires.' },
  { title: 'Indigenous Science',   icon: '🔭', slug: 'science',       description: 'African contributions to mathematics, astronomy, medicine, and engineering.' },
  { title: 'Languages & Oral Traditions', icon: '🗣️', slug: 'languages', description: 'Over 2,000 languages and centuries of oral literature, griots, and storytelling.' },
  { title: 'Sacred Architecture',  icon: '🏛️', slug: 'architecture',  description: 'From the Pyramids to Great Zimbabwe to the mud mosques of West Africa.' },
  { title: 'Music & Arts',         icon: '🎵', slug: 'arts',          description: 'The rhythms, paintings, sculptures, and artistic traditions that shaped world culture.' },
  { title: 'Religion & Mythology', icon: '🌙', slug: 'religion',      description: 'African spirituality, cosmology, and the rich world of African religious traditions.' },
  { title: 'Literature',           icon: '📖', slug: 'literature',    description: 'African writers, poets, and storytellers from antiquity to the present day.' },
  { title: 'Politics & Governance',icon: '⚖️', slug: 'politics',      description: 'African political thought, systems of governance, and independence movements.' },
  { title: 'Economics',            icon: '💰', slug: 'economics',     description: 'Trade routes, economic systems, and the economic history of Africa.' },
  { title: 'Agriculture',          icon: '🌾', slug: 'agriculture',   description: 'African farming traditions, crops that changed the world, and food cultures.' },
  { title: 'Medicine & Healing',   icon: '🌿', slug: 'medicine',      description: 'Traditional African medicine, healing practices, and medical knowledge systems.' },
]

export default function CollectionsPage() {
  const { user } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('collections')
      .select('*, owner:profiles!collections_owner_id_fkey(*)')
      .eq('is_public', true)
      .order('articles_count', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setCollections((data as Collection[]) ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = PRESET_COLLECTIONS.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container-app py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="heading-xl text-gray-900 dark:text-white mb-1">Knowledge Collections</h1>
          <p className="text-gray-500 dark:text-gray-400">Curated libraries of African knowledge by theme and discipline</p>
        </div>
        {user && (
          <Link to="/collections/create" className="btn btn-primary btn-md gap-2 flex-shrink-0" id="collections-create-btn">
            <Plus className="w-4 h-4" /> New Collection
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-10">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search collections…"
          className="input pl-11"
          id="collections-search"
        />
      </div>

      {/* Preset Collections Grid */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-1 bg-primary-500 rounded-full" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Knowledge Libraries</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(col => (
            <Link
              key={col.slug}
              to={`/collections/${col.slug}`}
              className="card-hover p-6 group"
              id={`collection-${col.slug}`}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">{col.icon}</div>
              <h3 className="font-serif font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">{col.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{col.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* User Collections */}
      {!loading && collections.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-1 bg-accent-500 rounded-full" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Community Collections</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map(col => (
              <Link key={col.id} to={`/collections/${col.slug}`} className="card-hover overflow-hidden group">
                {col.cover_image ? (
                  <img src={col.cover_image} alt={col.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-40 animated-gradient" />
                )}
                <div className="p-5">
                  <h3 className="font-serif font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1">{col.title}</h3>
                  {col.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{col.description}</p>}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{col.owner?.full_name || col.owner?.username}</span>
                    <span>{col.articles_count} articles</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
