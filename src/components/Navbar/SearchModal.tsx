import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Compass, History, ArrowRight } from 'lucide-react'
import { ARTIFACTS_DATA, TIMELINE_ERAS } from '../../data/archiveData'
import { STORIES_DATA } from '../../data/storyData'
import { ArtifactItem } from '../../types/archiveTypes'
import { StoryItem } from '../../types/storyTypes'
import { Badge } from '../ui/Badge'
import { useModalStack } from '../../hooks/useScrollLock'

export interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onInspectArtifact?: (artifact: ArtifactItem) => void
  onReadStory?: (story: StoryItem) => void
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const tokenize = (query: string) => normalize(query).split(/\s+/).filter(Boolean)

const matchesAll = (tokens: string[], fields: (string | undefined)[]) => {
  const haystack = normalize(fields.filter(Boolean).join(' '))
  return tokens.every((t) => haystack.includes(t))
}

function runSearch(query: string) {
  const tokens = tokenize(query)
  if (tokens.length === 0) return null

  const artifacts = ARTIFACTS_DATA.filter((a) =>
    matchesAll(tokens, [a.title, a.subtitle, a.summary, a.fullDescription, a.catalogNumber, a.originLocation, a.regionLabel, a.era]),
  )
  const stories = STORIES_DATA.filter((s) =>
    matchesAll(tokens, [s.title, s.subtitle, s.thinkerOrGriot, s.excerpt, s.quote, s.categoryLabel, s.region, s.era]),
  )
  const eras = TIMELINE_ERAS.filter((e) =>
    matchesAll(tokens, [e.title, e.civilization, e.region, e.summary, e.period]),
  )

  return { artifacts, stories, eras }
}

const QUICK_SEARCH_CANDIDATES = ['Timbuktu', 'Great Zimbabwe', 'Aksum', 'Benin', 'Ubuntu', 'Sundiata', 'Lalibela', 'Meroë', 'Dogon']

const QUICK_SEARCHES = QUICK_SEARCH_CANDIDATES.filter((term) => {
  const r = runSearch(term)
  return !!r && r.artifacts.length + r.stories.length > 0
}).slice(0, 6)

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onInspectArtifact,
  onReadStory,
}) => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const dialogRef = useModalStack<HTMLDivElement>(isOpen, onClose)

  const searchResults = useMemo(() => runSearch(query), [query])

  if (!isOpen) return null

  const openArchiveSearch = () => {
    const q = query.trim()
    onClose()
    navigate(q ? `/discover?q=${encodeURIComponent(q)}` : '/discover')
  }

  const hasResults =
    !!searchResults &&
    searchResults.artifacts.length + searchResults.stories.length + searchResults.eras.length > 0

  const resultButtonClass =
    'group w-full text-left px-4 py-3 rounded-xl bg-dark-card border border-white/10 hover:border-accent-400/40 hover:bg-white/[0.03] focus:outline-none focus-visible:border-accent-400 focus-visible:ring-2 focus-visible:ring-accent-400/40 flex justify-between items-center gap-3 transition-colors'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="museum-search-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-20 px-4 sm:px-6 animate-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-3xl bg-dark-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 max-h-[85vh] flex flex-col outline-none"
      >
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <h2 id="museum-search-title" className="heading-md text-white">
              Search the museum
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close search"
            className="p-2 rounded-lg text-ivory-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Live Search Input Bar */}
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim() && !hasResults) openArchiveSearch()
            }}
            aria-label="Search the museum"
            placeholder="Search manuscripts, places, people, ideas..."
            className="input text-base md:text-lg py-3.5 pl-12 placeholder:text-ivory-500"
            autoFocus
          />
          <Search className="w-5 h-5 text-ivory-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Search Results / Suggested Searches */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1" aria-live="polite">
          {searchResults ? (
            <div className="space-y-6">
              
              {searchResults.artifacts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="eyebrow">
                    Objects & places ({searchResults.artifacts.length})
                  </h3>
                  <div className="space-y-2">
                    {searchResults.artifacts.map((art) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => {
                          onClose()
                          onInspectArtifact?.(art)
                        }}
                        className={resultButtonClass}
                      >
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="bronze" size="sm" className="font-mono normal-case tracking-normal">
                              {art.catalogNumber}
                            </Badge>
                            <span className="text-xs text-ivory-400">
                              {art.regionLabel}
                            </span>
                          </div>
                          <span className="block font-serif font-bold text-lg leading-snug text-white group-hover:text-accent-300">
                            {art.title}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 flex-shrink-0 text-ivory-500 group-hover:text-accent-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.stories.length > 0 && (
                <div className="space-y-3">
                  <h3 className="eyebrow">
                    Stories & philosophy ({searchResults.stories.length})
                  </h3>
                  <div className="space-y-2">
                    {searchResults.stories.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          onClose()
                          onReadStory?.(st)
                        }}
                        className={resultButtonClass}
                      >
                        <div className="space-y-0.5">
                          <span className="block text-xs text-accent-300">
                            {st.thinkerOrGriot}
                          </span>
                          <span className="block font-serif font-bold text-lg leading-snug text-white group-hover:text-accent-300">
                            {st.title}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 flex-shrink-0 text-ivory-500 group-hover:text-accent-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.eras.length > 0 && (
                <div className="space-y-3">
                  <h3 className="eyebrow">
                    Timeline ({searchResults.eras.length})
                  </h3>
                  <div className="space-y-2">
                    {searchResults.eras.map((era) => {
                      const featured = ARTIFACTS_DATA.find((a) => a.id === era.featuredArtifactId)
                      return (
                        <button
                          key={era.id}
                          type="button"
                          disabled={!featured}
                          onClick={() => {
                            if (!featured) return
                            onClose()
                            onInspectArtifact?.(featured)
                          }}
                          className={`${resultButtonClass} disabled:cursor-default`}
                        >
                          <div className="space-y-0.5">
                            <span className="block text-xs text-ivory-400">
                              {era.period}
                            </span>
                            <span className="block font-serif font-bold text-lg leading-snug text-white group-hover:text-accent-300">
                              {era.title}
                            </span>
                          </div>
                          {featured && (
                            <ArrowRight className="w-4 h-4 flex-shrink-0 text-ivory-500 group-hover:text-accent-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {!hasResults && (
                <div className="text-center py-12 space-y-2 text-ivory-400">
                  <Compass className="w-8 h-8 text-accent-400 mx-auto" aria-hidden="true" />
                  <p className="text-sm">Nothing in the museum galleries matches "{query}".</p>
                  <p className="text-sm">Try a shorter search, or search the full archive below.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-ivory-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
                <span>Try searching for</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {QUICK_SEARCHES.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    type="button"
                    className="text-sm text-ivory-300 bg-white/5 border border-white/10 hover:border-accent-400/40 hover:text-accent-300 px-3 py-1 rounded-full transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-between items-center gap-3 text-ivory-500 text-xs">
          <span>Press <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 font-mono text-xs text-ivory-300">Esc</kbd> to close</span>
          <button
            type="button"
            onClick={openArchiveSearch}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 hover:text-accent-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 rounded-lg px-1"
          >
            <span>Search the full archive</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
