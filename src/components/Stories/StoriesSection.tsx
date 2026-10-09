import React, { useState } from 'react'
import { MessageSquareQuote } from 'lucide-react'
import { StoryItem, PhilosophyCategory } from '../../types/storyTypes'
import { STORIES_DATA, PROVERBS_DATA } from '../../data/storyData'
import { StoryCard } from './StoryCard'

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
    { key: 'all', label: 'All traditions' },
    { key: 'epistemology', label: 'Epistemology & reason' },
    { key: 'ethics', label: 'Ethics & wisdom' },
    { key: 'oral-epics', label: 'Oral epics & law' },
  ]

  const filteredStories = STORIES_DATA.filter((story) => {
    if (activeCategory === 'all') return true
    return story.category === activeCategory
  })

  return (
    <section
      id="stories"
      aria-label="Stories, Philosophies & Oral Traditions"
      className="py-12 md:py-16 bg-dark-surface border-t border-white/10 text-ivory-100"
    >
      <div className="container-app space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Intellectual heritage</span>
              <span className="text-xs text-ivory-400">
                Centuries of rational thought & oral traditions
              </span>
            </div>

            <h2 className="heading-xl text-white">
              Stories & philosophies
            </h2>

            <p className="text-sm md:text-base text-ivory-300 leading-relaxed">
              Immerse yourself in centuries of African philosophical thought, rationalist treatises, indigenous democratic frameworks, and Griot oral epics.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === cat.key
                    ? 'border-accent-400/50 bg-accent-400/15 text-accent-300'
                    : 'border-white/10 bg-white/5 text-ivory-300 hover:border-white/25 hover:text-white'
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
        <div className="card rounded-2xl p-6 md:p-10 space-y-8">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <MessageSquareQuote className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <h3 className="font-serif font-bold text-2xl text-white">
              Indigenous proverbs & philosophical maxims
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROVERBS_DATA.map((item) => (
              <div key={item.id} className="space-y-3 p-5 rounded-2xl bg-dark-surface border border-white/10 hover:border-white/20 transition-colors">
                <span className="badge badge-accent">
                  {item.originCulture} · {item.region}
                </span>
                
                <h4 className="font-serif text-xl md:text-2xl italic text-white font-medium">
                  "{item.proverb}"
                </h4>

                <p className="text-sm text-accent-300 italic">
                  Translation: {item.translation}
                </p>

                <p className="text-sm text-ivory-400 leading-relaxed pt-3 border-t border-white/10">
                  <strong className="text-ivory-100 text-xs font-semibold block mb-1">
                    Philosophical insight
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
