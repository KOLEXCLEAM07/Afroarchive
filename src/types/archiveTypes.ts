export type RegionFilter = 'all' | 'west' | 'east' | 'north' | 'southern' | 'central'

export type CategoryFilter =
  | 'all'
  | 'manuscripts'
  | 'civilizations'
  | 'science'
  | 'architecture'
  | 'philosophy'
  | 'arts'

export interface ArtifactItem {
  id: string
  catalogNumber: string
  title: string
  subtitle?: string
  category: CategoryFilter
  region: RegionFilter
  regionLabel: string
  era: string
  dateRange: string
  originLocation: string
  repository: string
  imageSrc?: string
  summary: string
  fullDescription: string
  keyInsights: string[]
  primarySources: string[]
  isFeatured?: boolean
  /** Slug of the database record this item was loaded from; links to /article/<slug>. */
  recordSlug?: string
}

export interface TimelineEra {
  id: string
  period: string
  title: string
  civilization: string
  region: string
  summary: string
  achievements: string[]
  featuredArtifactId: string
  bgAccent: string
}
