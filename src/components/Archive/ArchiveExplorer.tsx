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
      className="relative w-full bg-charcoal-900 text-ivory-100 py-24 border-t border-ivory-100/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ivory-100/10 pb-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-3">
              <Badge variant="bronze" size="sm">THE COLLECTION</Badge>
              <span className="font-mono text-2xs tracking-wide text-ivory-400">
                A starting point for further reading
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl md:text-5xl text-ivory-100 tracking-tight">
              Browse the collection
            </h2>

            <p className="font-sans text-sm md:text-base text-ivory-300 font-light leading-relaxed">
              Each entry is a short invitation: a manuscript, monument, work of art, or idea with context for your next step.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end space-y-2 font-mono text-2xs text-ivory-400">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-bronze-400" />
              <span>{filteredArtifacts.length} of {ARTIFACTS_DATA.length} featured entries</span>
            </div>
            <span className="text-bronze-400">Updated collection</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="space-y-6 bg-charcoal-850 p-6 rounded-lg border border-ivory-100/10">
          
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input Filter */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by keyword, location, or catalog number..."
                className="w-full bg-charcoal-950 text-ivory-100 font-sans text-xs px-4 py-3 pl-10 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none placeholder:text-ivory-500"
              />
              <Search className="w-4 h-4 text-ivory-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Region Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-2xs uppercase text-ivory-400 tracking-wider mr-2 hidden sm:inline">
                REGION:
              </span>
              {regions.map((reg) => (
                <button
                  key={reg.key}
                  onClick={() => setSelectedRegion(reg.key)}
                  type="button"
                  className={`font-mono text-2xs px-3 py-1.5 rounded uppercase tracking-wider transition-all duration-300 ${
                    selectedRegion === reg.key
                      ? 'bg-bronze-400 text-charcoal-950 font-bold'
                      : 'bg-charcoal-900 text-ivory-300 border border-ivory-100/10 hover:border-bronze-400/40 hover:text-ivory-100'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-2 border-t border-ivory-100/5 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                type="button"
                className={`font-sans text-xs font-medium uppercase tracking-widest px-4 py-2 rounded-sm whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === cat.key
                    ? 'text-bronze-300 border-b-2 border-bronze-400 bg-charcoal-900/60'
                    : 'text-ivory-400 hover:text-ivory-200'
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
          <div className="text-center py-16 bg-charcoal-850 rounded-lg border border-ivory-100/10 space-y-4">
            <Compass className="w-10 h-10 text-bronze-400 mx-auto" />
            <h3 className="font-display text-xl text-ivory-100">No Matching Archival Items Found</h3>
            <p className="font-sans text-xs text-ivory-400 max-w-md mx-auto">
              Try adjusting your category tabs or clearing the search query filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedRegion('all')
                setSearchQuery('')
              }}
              type="button"
              className="font-mono text-2xs uppercase tracking-widest text-bronze-400 underline underline-offset-4"
            >
              RESET ALL FILTERS
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
