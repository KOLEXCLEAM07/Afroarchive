import React, { useState, useMemo, useEffect } from 'react'
import { Search, Filter, Compass, BookOpen, Layers, Database } from 'lucide-react'
import { CategoryFilter, RegionFilter, ArtifactItem } from '../../types/archiveTypes'
import { ARTIFACTS_DATA } from '../../data/archiveData'
import { ArtifactCard } from './ArtifactCard'
import { Badge } from '../ui/Badge'
import { supabase } from '../../lib/supabase'

export interface ArchiveExplorerProps {
  onInspectArtifact: (artifact: ArtifactItem) => void
  isBookmarked?: (id: string) => boolean
  onToggleBookmark?: (artifact: ArtifactItem) => void
}

export const ArchiveExplorer: React.FC<ArchiveExplorerProps> = ({
  onInspectArtifact,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [liveArtifacts, setLiveArtifacts] = useState<ArtifactItem[]>([])
  const [isLiveActive, setIsLiveActive] = useState(false)

  useEffect(() => {
    async function loadLiveArtifacts() {
      try {
        const { data, error } = await supabase
          .from('knowledge_items')
          .select('*, sources(name, slug), media(file_url, thumbnail_url)')
          .not('summary', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!error && data && data.length > 0) {
          const mapped: ArtifactItem[] = data.map((item: any) => {
            let cat: CategoryFilter = 'civilizations'
            if (item.knowledge_type === 'manuscript') cat = 'manuscripts'
            else if (item.knowledge_type === 'cultural_artifact') cat = 'arts'
            else if (item.knowledge_type === 'place') cat = 'architecture'
            else if (item.knowledge_type === 'work') cat = 'science'

            // Extract real image from media relation or original_url
            const rawMedia =
              item.media?.[0]?.thumbnail_url ||
              item.media?.[0]?.file_url ||
              item.original_url
            let imgSrc = rawMedia ? rawMedia.split('?')[0] : ''

            // High-resolution African heritage fallback if item has no direct media
            if (
              !imgSrc ||
              (!imgSrc.includes('wikimedia.org') &&
                !imgSrc.includes('unsplash.com') &&
                !/\.(jpg|jpeg|png|webp|JPG|PNG|gif|svg)$/i.test(imgSrc))
            ) {
              imgSrc =
                cat === 'manuscripts'
                  ? 'https://upload.wikimedia.org/wikipedia/commons/3/39/Timbuktu-manuscripts-astronomy-tables.jpg'
                  : cat === 'architecture'
                  ? 'https://upload.wikimedia.org/wikipedia/commons/1/19/Great-Zimbabwe-6.jpg'
                  : cat === 'arts'
                  ? 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Benin_bronze_Louvre_A97-14-1.jpg'
                  : 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80'
            }

            return {
              id: item.id,
              catalogNumber: `AFR-${item.id.slice(0, 6).toUpperCase()}`,
              title: item.title,
              subtitle: `Provenance: ${item.sources?.name || 'AfroArchive'}`,
              category: cat,
              region: 'west',
              regionLabel: item.country_codes?.[0] ? `AFRICA (${item.country_codes[0]})` : 'AFRICA',
              era: 'Verified Archive',
              dateRange: 'Canonical Heritage',
              originLocation: item.sources?.name || 'African Continent',
              repository: item.sources?.name || 'AfroArchive Repository',
              imageSrc: imgSrc,
              summary: item.summary || item.title,
              fullDescription: item.content || item.summary || item.title,
              keyInsights: [
                `Attribution: ${item.attribution || 'AfroArchive Registered'}`,
                `License: ${item.license_type || 'Preserved'}`,
              ],
              primarySources: [item.source_url || 'https://afroarchive.org'],
              isFeatured: true,
            }
          })
          setLiveArtifacts(mapped)
          setIsLiveActive(true)
        }
      } catch (err) {
        console.warn('Could not load live artifacts:', err)
      }
    }
    loadLiveArtifacts()
  }, [])

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'ALL COLLECTIONS' },
    { key: 'manuscripts', label: 'MANUSCRIPTS' },
    { key: 'civilizations', label: 'CIVILIZATIONS' },
    { key: 'science', label: 'SCIENCE & ASTRONOMY' },
    { key: 'architecture', label: 'ARCHITECTURE' },
    { key: 'arts', label: 'ARTS & REGALIA' },
  ]

  const regions: { key: RegionFilter; label: string }[] = [
    { key: 'all', label: 'ALL REGIONS' },
    { key: 'west', label: 'WEST AFRICA' },
    { key: 'east', label: 'EAST AFRICA' },
    { key: 'north', label: 'NORTH AFRICA' },
    { key: 'southern', label: 'SOUTHERN AFRICA' },
  ]

  // Filtered dataset evaluation combining live Supabase records + reference catalog
  const filteredArtifacts = useMemo(() => {
    const combined = [...liveArtifacts, ...ARTIFACTS_DATA]
    return combined.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchRegion = selectedRegion === 'all' || item.region === selectedRegion
      const matchSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.originLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.catalogNumber.toLowerCase().includes(searchQuery.toLowerCase())

      return matchCategory && matchRegion && matchSearch
    })
  }, [selectedCategory, selectedRegion, searchQuery, liveArtifacts])

  return (
    <section
      id="archive"
      aria-label="Archive Explorer and Collections"
      className="section bg-white dark:bg-dark-surface border-t border-sand-200 dark:border-dark-border text-gray-900 dark:text-ivory-100 transition-colors"
    >
      <div className="container-app space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-sand-200 dark:border-dark-border pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="badge badge-primary">THE COLLECTION</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                A starting point for further reading
              </span>
            </div>

            <h2 className="heading-xl text-gray-900 dark:text-white tracking-tight">
              Browse the Collection
            </h2>

            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
              Each entry is a short invitation: a manuscript, monument, work of art, or idea with context for your next step.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end space-y-1.5 text-xs text-gray-500 dark:text-gray-400 font-mono">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary-500" />
              <span>{filteredArtifacts.length} of {ARTIFACTS_DATA.length} featured entries</span>
            </div>
            <span className="badge badge-primary">CURATED ARCHIVE</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="card p-6 bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border space-y-6">
          
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input Filter */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by keyword, location, or catalog number..."
                className="input pl-10 text-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Region Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mr-1 hidden sm:inline">
                Region:
              </span>
              {regions.map((reg) => (
                <button
                  key={reg.key}
                  onClick={() => setSelectedRegion(reg.key)}
                  type="button"
                  className={`badge transition-all cursor-pointer ${
                    selectedRegion === reg.key
                      ? 'badge-primary font-bold'
                      : 'badge-gray hover:border-primary-400/40'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-2 border-t border-sand-200 dark:border-dark-border no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                type="button"
                className={`font-sans text-xs font-medium uppercase tracking-wider px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-primary-500 text-white font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-card'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Artifact Grid */}
        {filteredArtifacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArtifacts.map((item) => (
              <ArtifactCard
                key={item.id}
                artifact={item}
                onInspect={onInspectArtifact}
                isBookmarked={isBookmarked ? isBookmarked(item.id) : false}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        ) : (
          <div className="card p-16 text-center space-y-4">
            <Compass className="w-10 h-10 text-primary-400/60 mx-auto" />
            <h3 className="heading-sm text-gray-900 dark:text-white">No Matching Archival Items Found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Try adjusting your category tabs or clearing the search query filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedRegion('all')
                setSearchQuery('')
              }}
              type="button"
              className="btn btn-primary btn-sm"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
