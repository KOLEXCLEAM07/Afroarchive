import React, { useState } from 'react'
import { Quote, Sparkles, BookOpen, UserCheck, MessageSquareQuote } from 'lucide-react'
import { StoryItem, PhilosophyCategory } from '../../types/storyTypes'
import { STORIES_DATA, PROVERBS_DATA } from '../../data/storyData'
import { StoryCard } from './StoryCard'
import { Badge } from '../ui/Badge'

export interface StoriesSectionProps {
  onReadStory: (story: StoryItem) => void
  isBookmarked?: (id: string) => boolean
  onToggleBookmark?: (story: StoryItem) => void
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({
  onReadStory,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [activeCategory, setActiveCategory] = useState<PhilosophyCategory>('all')

  const categories: { key: PhilosophyCategory; label: string }[] = [
    { key: 'all', label: 'ALL TRADITIONS' },
    { key: 'epistemology', label: 'EPISTEMOLOGY & REASON' },
    { key: 'ethics', label: 'ETHICS & WISDOM' },
    { key: 'oral-epics', label: 'ORAL EPICS & LAW' },
  ]

  const filteredStories = STORIES_DATA.filter((story) => {
    if (activeCategory === 'all') return true
    return story.category === activeCategory
  })

  return (
    <section
      id="stories"
      aria-label="Stories, Philosophies & Oral Traditions"
      className="relative w-full bg-charcoal-900 text-ivory-100 py-24 border-t border-ivory-100/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ivory-100/10 pb-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-3">
              <Badge variant="bronze" size="sm">
                EXHIBITION GALLERY 04
              </Badge>
              <span className="font-mono text-2xs uppercase tracking-widest text-ivory-400">
                INTELLECTUAL HERITAGE
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl md:text-5xl text-ivory-100 tracking-tight">
              STORIES & PHILOSOPHIES
            </h2>

            <p className="font-sans text-sm md:text-base text-ivory-300 font-light leading-relaxed">
              Immerse yourself in centuries of African philosophical thought, rationalist treatises, indigenous democratic frameworks, and Griot oral epics.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                type="button"
                className={`font-mono text-2xs uppercase tracking-wider px-3.5 py-2 rounded transition-all duration-300 ${
                  activeCategory === cat.key
                    ? 'bg-bronze-400 text-charcoal-950 font-bold'
                    : 'bg-charcoal-850 text-ivory-300 border border-ivory-100/10 hover:border-bronze-400/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onRead={onReadStory}
              isBookmarked={isBookmarked ? isBookmarked(story.id) : false}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>

        {/* African Indigenous Proverbs & Wisdom Spotlight */}
        <div className="bg-charcoal-850 rounded-lg border border-ivory-100/10 p-8 md:p-12 space-y-8 shadow-museum">
          <div className="flex items-center space-x-3 border-b border-ivory-100/10 pb-4">
            <MessageSquareQuote className="w-5 h-5 text-bronze-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-bronze-400">
              INDIGENOUS PROVERBS & PHILOSOPHICAL MAXIMS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROVERBS_DATA.map((item) => (
              <div key={item.id} className="space-y-3 p-5 rounded bg-charcoal-900 border border-ivory-100/5 hover:border-bronze-400/30 transition-colors">
                <span className="font-mono text-2xs uppercase text-bronze-400 tracking-wider">
                  {item.originCulture} · {item.region}
                </span>
                
                <h4 className="font-serif text-lg md:text-xl italic text-ivory-100 font-medium">
                  "{item.proverb}"
                </h4>

                <p className="font-sans text-xs text-bronze-300 font-medium italic">
                  Translation: {item.translation}
                </p>

                <p className="font-sans text-xs text-ivory-300 font-light leading-relaxed pt-2 border-t border-ivory-100/5">
                  <strong className="text-ivory-100 font-mono text-[10px] uppercase tracking-wider block mb-1">
                    Philosophical Insight:
                  </strong>
                  {item.philosophicalMeaning}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
