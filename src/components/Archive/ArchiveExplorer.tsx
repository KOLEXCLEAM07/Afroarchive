import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Compass, Layers, Box } from 'lucide-react'
import { CategoryFilter, RegionFilter, ArtifactItem } from '../../types/archiveTypes'
import { ARTIFACTS_DATA } from '../../data/archiveData'
import { ArtifactCard } from './ArtifactCard'
import { fetchKnowledgePage, queryKey, PAGE_SIZE } from '../../lib/knowledgeQuery'
import { usePagedQuery } from '../../hooks/usePagedQuery'
import { cleanRecordText, cleanRecordTitle, usefulPeriod } from '../../lib/knowledge'

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
  media: { file_url: string | null; thumbnail_url: string | null; media_type?: string | null }[] | null
}

// Which kinds of imported records each museum category shows. Scholarly works are bibliographic
// records, not objects, so they stay out of the gallery; "science" is covered by the curated set.
const LIVE_TYPES: Record<CategoryFilter, string[] | null> = {
  all: ['cultural_artifact', 'manuscript', 'place', 'kingdom_or_state', 'culture', 'person'],
  manuscripts: ['manuscript'],
  civilizations: ['kingdom_or_state', 'culture', 'person'],
  science: null,
  philosophy: null,
  architecture: ['place'],
  arts: ['cultural_artifact'],
}
/** Inner join, so the `only3d` filter and its count only see records with media. */
const LIVE_SELECT = '*, sources(name, slug), media!inner(file_url, thumbnail_url, media_type)'

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

  // The preview image comes from a photo if there is one; a 3D scan only contributes its poster.
  const model = item.media?.find((m) => m.media_type === '3d_model' && m.file_url)
  const media = item.media?.find((m) => m.media_type !== '3d_model') ?? model
  const imageSrc =
    media?.thumbnail_url ||
    media?.file_url ||
    (item.original_url && looksLikeImage(item.original_url) ? item.original_url : undefined)

  const countryCode = item.country_codes?.[0]?.toUpperCase()
  const region = countryCode ? REGION_BY_COUNTRY[countryCode] : undefined
  const countryName = countryCode ? countryNameFor(countryCode) : undefined
  const sourceName = item.sources?.name || undefined
  // Imported "periods" are often upload years or noise; only keep historical ones.
  const period = usefulPeriod(item.time_period) ?? ''
  const sourceUrl = item.source_url || item.original_url

  // Items without a known region use 'all' so they only appear under "All regions".
  return {
    id: item.id,
    catalogNumber: sourceName ?? 'Archive record',
    title: cleanRecordTitle(item.title),
    subtitle: sourceName ? `Source: ${sourceName}` : undefined,
    category: cat,
    region: region ?? 'all',
    regionLabel: region ? REGION_LABELS[region] : countryName ?? '',
    era: period,
    dateRange: period,
    originLocation: countryName ?? '',
    repository: sourceName || 'Source not recorded',
    imageSrc: imageSrc || undefined,
    summary: cleanRecordText(item.summary) || cleanRecordTitle(item.title),
    fullDescription: cleanRecordText(item.content || item.summary) || cleanRecordTitle(item.title),
    keyInsights: [
      item.attribution ? `Attribution: ${item.attribution}` : null,
      item.license_type ? `Licence: ${item.license_type}` : null,
    ].filter((v): v is string => !!v),
    primarySources: sourceUrl ? [sourceUrl] : [],
    isFeatured: false,
    recordSlug: item.slug || undefined,
    model3d: model
      ? { embedUrl: model.file_url as string, poster: model.thumbnail_url, viewerUrl: item.source_url, credit: item.attribution }
      : undefined,
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
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [only3d, setOnly3d] = useState(false)

  useEffect(() => {
    setSelectedRegion(initialRegion)
  }, [initialRegion])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchLivePage = useCallback(
    async (page: number) => {
      const types = LIVE_TYPES[selectedCategory]
      if (!types) return { items: [] as ArtifactItem[], total: 0 }
      const { rows, total } = await fetchKnowledgePage<KnowledgeRow>({
        page,
        pageSize: PAGE_SIZE,
        select: LIVE_SELECT,
        types,
        countryCodes: selectedRegion === 'all' ? undefined : REGION_COUNTRIES[selectedRegion],
        only3d,
        search: debouncedQuery,
        searchColumns: ['title', 'summary'],
      })
      return { items: rows.map(mapKnowledgeRow), total }
    },
    [selectedCategory, selectedRegion, debouncedQuery, only3d],
  )

  // The same photograph is sometimes imported twice under different titles.
  const dedupeArtifact = useCallback((a: ArtifactItem) => a.imageSrc || a.title.toLowerCase(), [])

  // A null key disables the query for categories that show curated items only.
  const liveKey = useMemo(() => {
    if (!LIVE_TYPES[selectedCategory]) return null
    return queryKey('archive', {
      category: selectedCategory,
      region: selectedRegion,
      q: debouncedQuery.trim(),
      only3d,
    })
  }, [selectedCategory, selectedRegion, debouncedQuery, only3d])

  const {
    items: liveArtifacts,
    total: liveTotal,
    loadingMore,
    loadMore,
  } = usePagedQuery<ArtifactItem>({ key: liveKey, fetchPage: fetchLivePage, dedupeKey: dedupeArtifact })


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

  const filteredStatic = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (only3d) return []
    return ARTIFACTS_DATA.filter((item) => {
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
  }, [selectedCategory, selectedRegion, searchQuery, only3d])

  const filteredArtifacts = useMemo(() => [...filteredStatic, ...liveArtifacts], [filteredStatic, liveArtifacts])
  const totalEntries = ARTIFACTS_DATA.length + liveTotal

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
              <span>Showing {filteredArtifacts.length.toLocaleString()} of {totalEntries.toLocaleString()} entries</span>
            </div>
            {liveTotal > 0 && (
              <span>Includes {liveTotal.toLocaleString()} records from open museum and heritage collections</span>
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
              <button
                type="button"
                onClick={() => setOnly3d((v) => !v)}
                aria-pressed={only3d}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  only3d
                    ? 'border-accent-400/50 bg-accent-400/15 text-accent-300'
                    : 'border-white/10 bg-white/5 text-ivory-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" aria-hidden="true" /> 3D models
              </button>
              <span className="hidden sm:inline h-4 w-px bg-white/10" aria-hidden="true" />
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
          <div className="space-y-10">
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
            {liveArtifacts.length < liveTotal && (
              <div className="text-center">
                <button type="button" onClick={loadMore} disabled={loadingMore} className="btn btn-outline btn-md">
                  {loadingMore ? 'Loading…' : `Show more (${(liveTotal - liveArtifacts.length).toLocaleString()} remaining)`}
                </button>
              </div>
            )}
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
                setOnly3d(false)
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
