export type PhilosophyCategory =
  | 'all'
  | 'ethics'
  | 'epistemology'
  | 'oral-epics'
  | 'governance'
  | 'cosmology'

export interface StoryItem {
  id: string
  title: string
  subtitle?: string
  thinkerOrGriot: string
  category: PhilosophyCategory
  categoryLabel: string
  region: string
  era: string
  dateRange?: string
  readingTime: string
  quote: string
  excerpt: string
  fullContent: string
  historicalContext: string
  scholarNotes: string
  primarySources: string[]
  isFeatured?: boolean
}

export interface ProverbItem {
  id: string
  proverb: string
  translation: string
  originCulture: string
  region: string
  philosophicalMeaning: string
}
