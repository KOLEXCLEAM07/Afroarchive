import React, { useState, useEffect, useMemo } from 'react'
import { Search, X, BookOpen, Compass, History, Sparkles, Calendar, Quote, ArrowRight } from 'lucide-react'
import { ARTIFACTS_DATA } from '../../data/archiveData'
import { STORIES_DATA } from '../../data/storyData'
import { TIMELINE_ERAS } from '../../data/archiveData'
import { KNOWLEDGE_BASE } from '../../data/aiKnowledgeBase'
import { ArtifactItem } from '../../types/archiveTypes'
import { StoryItem } from '../../types/storyTypes'
import { Badge } from '../ui/Badge'

export interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onInspectArtifact?: (artifact: ArtifactItem) => void
  onReadStory?: (story: StoryItem) => void
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onInspectArtifact,
  onReadStory,
}) => {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Multi-index search evaluation
  const searchResults = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()

    const artifacts = ARTIFACTS_DATA.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.catalogNumber.toLowerCase().includes(q) ||
        a.originLocation.toLowerCase().includes(q)
    )

    const stories = STORIES_DATA.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.thinkerOrGriot.toLowerCase().includes(q) ||
        s.excerpt.toLowerCase().includes(q) ||
        s.quote.toLowerCase().includes(q)
    )

    const eras = TIMELINE_ERAS.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.civilization.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q)
    )

    const aiTopics = KNOWLEDGE_BASE.filter(
      (k) =>
        k.topicTitle.toLowerCase().includes(q) ||
        k.keywords.some((kw) => kw.includes(q))
    )

    return { artifacts, stories, eras, aiTopics }
  }, [query])

  if (!isOpen) return null

  const suggestedQueries = [
    'Timbuktu Manuscripts',
    'Zera Yacob Hatäta',
    'Aksum Monolithic Stele',
    'Great Zimbabwe Drystone',
    'Benin Bronze Plaque',
    'Dogon Sirius B Astronomy',
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Live Multi-Index Search"
      className="fixed inset-0 z-50 bg-charcoal-950/95 backdrop-blur-xl flex items-start justify-center pt-16 md:pt-20 px-4 sm:px-6 animate-fade-in"
    >
      <div className="relative w-full max-w-3xl bg-charcoal-900 border border-ivory-100/15 rounded-lg shadow-museum overflow-hidden p-6 md:p-8 space-y-6 max-h-[85vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-ivory-100/10 pb-4">
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-bronze-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-bronze-400">
              AFROARCHIVE GLOBAL MULTI-INDEX SEARCH
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close search modal"
            className="p-1.5 text-ivory-400 hover:text-bronze-300 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Input Bar */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manuscripts, civilizations, philosophies, astronomy, catalog IDs..."
            className="w-full bg-charcoal-950 text-ivory-100 font-sans text-base md:text-lg px-5 py-4 pl-12 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none placeholder:text-ivory-500"
            autoFocus
          />
          <Search className="w-5 h-5 text-ivory-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* Search Results / Suggested Searches */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {searchResults ? (
            <div className="space-y-6">
              
              {/* Artifacts Match Results */}
              {searchResults.artifacts.length > 0 && (
                <div className="space-y-3">
                  <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400 block">
                    CATALOG ARTIFACTS ({searchResults.artifacts.length})
                  </span>
                  <div className="space-y-2">
                    {searchResults.artifacts.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => {
                          if (onInspectArtifact) onInspectArtifact(art)
                          onClose()
                        }}
                        className="group p-3 rounded bg-charcoal-850 border border-ivory-100/10 hover:border-bronze-400/50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <Badge variant="bronze" size="sm">
                              {art.catalogNumber}
                            </Badge>
                            <span className="font-mono text-[10px] text-ivory-400">
                              {art.regionLabel}
                            </span>
                          </div>
                          <h4 className="font-display font-semibold text-sm text-ivory-100 group-hover:text-bronze-300">
                            {art.title}
                          </h4>
                        </div>
                        <ArrowRight className="w-4 h-4 text-ivory-500 group-hover:text-bronze-400 transition-transform group-hover:translate-x-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stories & Philosophies Match Results */}
              {searchResults.stories.length > 0 && (
                <div className="space-y-3">
                  <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400 block">
                    PHILOSOPHIES & STORIES ({searchResults.stories.length})
                  </span>
                  <div className="space-y-2">
                    {searchResults.stories.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => {
                          if (onReadStory) onReadStory(st)
                          onClose()
                        }}
                        className="group p-3 rounded bg-charcoal-850 border border-ivory-100/10 hover:border-bronze-400/50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] text-bronze-300 uppercase">
                            {st.thinkerOrGriot}
                          </span>
                          <h4 className="font-display font-semibold text-sm text-ivory-100 group-hover:text-bronze-300">
                            {st.title}
                          </h4>
                        </div>
                        <ArrowRight className="w-4 h-4 text-ivory-500 group-hover:text-bronze-400 transition-transform group-hover:translate-x-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.artifacts.length === 0 && searchResults.stories.length === 0 && (
                <div className="text-center py-12 space-y-2 text-ivory-400">
                  <Compass className="w-8 h-8 text-bronze-400 mx-auto" />
                  <p className="font-sans text-xs">No direct matches found for "{query}".</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <span className="font-mono text-2xs uppercase tracking-widest text-ivory-400 flex items-center space-x-1">
                <History className="w-3.5 h-3.5 text-bronze-400" />
                <span>CURATED QUICK SEARCHES</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    type="button"
                    className="font-mono text-xs text-ivory-300 bg-charcoal-800 border border-ivory-100/10 hover:border-bronze-400/50 hover:text-bronze-300 px-3 py-1.5 rounded-sm transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-ivory-100/10 flex justify-between items-center text-ivory-500 font-mono text-[10px]">
          <span>PRESS ESC TO CLOSE</span>
          <span>MULTI-INDEX INDEXING ACTIVE</span>
        </div>
      </div>
    </div>
  )
}
