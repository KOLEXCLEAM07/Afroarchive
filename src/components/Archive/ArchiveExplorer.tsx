import React, { useState, useMemo, useEffect } from 'react'
import { Search, Compass, Layers } from 'lucide-react'
import { CategoryFilter, RegionFilter, ArtifactItem } from '../../types/archiveTypes'
import { ARTIFACTS_DATA } from '../../data/archiveData'
import { ArtifactCard } from './ArtifactCard'
import { supabase } from '../../lib/supabase'

export interface ArchiveExplorerProps {
  onInspectArtifact: (artifact: ArtifactItem) => void
  isBookmarked?: (id: string) => boolean
  onToggleBookmark?: (artifact: ArtifactItem) => void
  initialRegion?: RegionFilter
}

type KnownRegion = Exclude<RegionFilter, 'all'>

const REGION_BY_COUNTRY: Record<string, KnownRegion> = {}
const REGION_COUNTRIES: Record<KnownRegion, string[]> = {
  west: ['NG', 'GH', 'ML', 'SN', 'BF', 'NE', 'CI', 'GN', 'BJ', 'TG', 'SL', 'LR', 'GM', 'GW', 'MR', 'CV'],
  east: ['ET', 'KE', 'TZ', 'UG', 'RW', 'BI', 'SO', 'ER', 'DJ', 'SS'],
  north: ['EG', 'SD', 'LY', 'TN', 'DZ', 'MA'],
  central: ['CD', 'CG', 'CM', 'CF', 'TD', 'GA', 'GQ', 'AO'],
  southern: ['ZA', 'ZW', 'ZM', 'MW', 'MZ', 'BW', 'NA', 'LS', 'SZ', 'MG'],
}
for (const [region, codes] of Object.entries(REGION_COUNTRIES) as [KnownRegion, string[]][]) {
  codes.forEach((code) => {
    REGION_BY_COUNTRY[code] = region
  })
}

const REGION_LABELS: Record<KnownRegion, string> = {
  west: 'West Africa',
  east: 'East Africa',
  north: 'North Africa',
  central: 'Central Africa',
  southern: 'Southern Africa',
}

interface KnowledgeRow {
  id: string
  slug: string | null
  title: string
  summary: string | null
  content: string | null
  knowledge_type: string | null
  country_codes: string[] | null
  time_period: string | null
  attribution: string | null
  license_type: string | null
  source_url: string | null
  original_url: string | null
  sources: { name: string | null; slug: string | null } | null
  media: { file_url: string | null; thumbnail_url: string | null }[] | null
}

const looksLikeImage = (url: string) => {
  try {
    return /\.(jpe?g|png|webp|gif|svg)$/i.test(new URL(url).pathname)
  } catch {
    return false
  }
}

const countryNameFor = (code: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

function mapKnowledgeRow(item: KnowledgeRow): ArtifactItem {
  let cat: CategoryFilter = 'civilizations'
  if (item.knowledge_type === 'manuscript') cat = 'manuscripts'
  else if (item.knowledge_type === 'cultural_artifact') cat = 'arts'
  else if (item.knowledge_type === 'place') cat = 'architecture'
  else if (item.knowledge_type === 'work') cat = 'science'

  const media = item.media?.[0]
  const imageSrc =
    media?.thumbnail_url ||
    media?.file_url ||
    (item.original_url && looksLikeImage(item.original_url) ? item.original_url : undefined)

  const countryCode = item.country_codes?.[0]?.toUpperCase()
  const region = countryCode ? REGION_BY_COUNTRY[countryCode] : undefined
  const countryName = countryCode ? countryNameFor(countryCode) : undefined
  const sourceName = item.sources?.name || undefined
  const period = item.time_period || 'Date not recorded'
  const sourceUrl = item.source_url || item.original_url

  // Items without a known region use 'all' so they only appear under "All regions".
  return {
    id: item.id,
    catalogNumber: sourceName ? sourceName.toUpperCase() : 'ARCHIVE RECORD',
    title: item.title,
    subtitle: sourceName ? `Source: ${sourceName}` : undefined,
    category: cat,
    region: region ?? 'all',
    regionLabel: region ? REGION_LABELS[region] : countryName ? countryName : 'Region not recorded',
    era: period,
    dateRange: period,
    originLocation: countryName || 'Location not recorded',
    repository: sourceName || 'Source not recorded',
    imageSrc: imageSrc || undefined,
    summary: item.summary || item.title,
    fullDescription: item.content || item.summary || item.title,
    keyInsights: [
      item.attribution ? `Attribution: ${item.attribution}` : null,
      item.license_type ? `Licence: ${item.license_type}` : null,
    ].filter((v): v is string => !!v),
    primarySources: sourceUrl ? [sourceUrl] : [],
    isFeatured: false,
    recordSlug: item.slug || undefined,
  }
}

export const ArchiveExplorer: React.FC<ArchiveExplorerProps> = ({
  onInspectArtifact,
  isBookmarked,
  onToggleBookmark,
  initialRegion = 'all',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>(initialRegion)
  const [searchQuery, setSearchQuery] = useState('')
  const [liveArtifacts, setLiveArtifacts] = useState<ArtifactItem[]>([])

  useEffect(() => {
    setSelectedRegion(initialRegion)
  }, [initialRegion])

  useEffect(() => {
    let cancelled = false
    async function loadLiveArtifacts() {
      try {
        const { data, error } = await supabase
          .from('knowledge_items')
          .select('*, sources(name, slug), media(file_url, thumbnail_url)')
          .not('summary', 'is', null)
          .or('verification_status.is.null,verification_status.neq.flagged')
          .order('created_at', { ascending: false })
          .limit(20)

        if (!cancelled && !error && data && data.length > 0) {
          setLiveArtifacts((data as unknown as KnowledgeRow[]).map(mapKnowledgeRow))
        }
      } catch (err) {
        console.warn('Could not load archive records:', err)
      }
    }
    loadLiveArtifacts()
    return () => {
      cancelled = true
    }
  }, [])

  const combinedArtifacts = useMemo(() => [...liveArtifacts, ...ARTIFACTS_DATA], [liveArtifacts])

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All collections' },
    { key: 'manuscripts', label: 'Manuscripts' },
    { key: 'civilizations', label: 'Civilizations' },
    { key: 'science', label: 'Science & astronomy' },
    { key: 'architecture', label: 'Architecture' },
    { key: 'arts', label: 'Arts & regalia' },
  ]

  const regions: { key: RegionFilter; label: string }[] = [
    { key: 'all', label: 'All regions' },
    { key: 'west', label: 'West Africa' },
    { key: 'east', label: 'East Africa' },
    { key: 'north', label: 'North Africa' },
    { key: 'central', label: 'Central Africa' },
    { key: 'southern', label: 'Southern Africa' },
  ]

  const filteredArtifacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return combinedArtifacts.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchRegion = selectedRegion === 'all' || item.region === selectedRegion
      const matchSearch =
        q === '' ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.originLocation.toLowerCase().includes(q) ||
        item.catalogNumber.toLowerCase().includes(q)

      return matchCategory && matchRegion && matchSearch
    })
  }, [selectedCategory, selectedRegion, searchQuery, combinedArtifacts])

  return (
    <section
      id="archive"
      aria-label="Archive Explorer and Collections"
      className="py-12 md:py-16 bg-dark-bg border-t border-white/10 text-ivory-100"
    >
      <div className="container-app space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">The collection</span>
              <span className="text-xs text-ivory-400">
                A starting point for further reading
              </span>
            </div>

            <h2 className="heading-xl text-white">
              Browse the collection
            </h2>

            <p className="text-sm md:text-base text-ivory-300 leading-relaxed">
              Each entry is a short invitation: a manuscript, monument, work of art, or idea with context for your next step.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end space-y-1.5 text-xs text-ivory-400">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-400" aria-hidden="true" />
              <span>Showing {filteredArtifacts.length} of {combinedArtifacts.length} entries</span>
            </div>
            {liveArtifacts.length > 0 && (
              <span>Includes {liveArtifacts.length} recent records from open collections</span>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="card rounded-2xl p-5 md:p-6 space-y-5">
          
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input Filter */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter the collection"
                placeholder="Filter by keyword, location, or catalog number..."
                className="input pl-10 text-sm"
              />
              <Search className="w-4 h-4 text-ivory-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Region Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-ivory-400 mr-1 hidden sm:inline">
                Region:
              </span>
              {regions.map((reg) => (
                <button
                  key={reg.key}
                  onClick={() => setSelectedRegion(reg.key)}
                  type="button"
                  aria-pressed={selectedRegion === reg.key}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    selectedRegion === reg.key
                      ? 'border-accent-400/50 bg-accent-400/15 text-accent-300'
                      : 'border-white/10 bg-white/5 text-ivory-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-4 border-t border-white/10 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                type="button"
                className={`text-sm font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-white/10 text-white'
                    : 'text-ivory-400 hover:text-white hover:bg-white/5'
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
          <div className="card rounded-2xl p-12 md:p-16 text-center space-y-4">
            <Compass className="w-10 h-10 text-accent-400/60 mx-auto" aria-hidden="true" />
            <h3 className="font-serif font-bold text-2xl text-white">No matching items found</h3>
            <p className="text-sm text-ivory-400 max-w-md mx-auto">
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
              Reset all filters
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
