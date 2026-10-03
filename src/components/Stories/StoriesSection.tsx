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
      className="section bg-white dark:bg-dark-surface border-t border-sand-200 dark:border-dark-border text-gray-900 dark:text-ivory-100 transition-colors"
    >
      <div className="container-app space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-sand-200 dark:border-dark-border pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="badge badge-primary">INTELLECTUAL HERITAGE</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Centuries of rational thought & oral traditions
              </span>
            </div>

            <h2 className="heading-xl text-gray-900 dark:text-white tracking-tight">
              Stories & Philosophies
            </h2>

            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
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
                className={`badge transition-all cursor-pointer ${
                  activeCategory === cat.key
                    ? 'badge-primary font-bold'
                    : 'badge-gray hover:border-primary-400/40'
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
        <div className="card p-8 md:p-12 bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border space-y-8">
          <div className="flex items-center space-x-3 border-b border-sand-200 dark:border-dark-border pb-4">
            <MessageSquareQuote className="w-5 h-5 text-primary-600 dark:text-accent-400" />
            <span className="text-xs font-semibold text-primary-600 dark:text-accent-400 uppercase tracking-wider">
              Indigenous Proverbs & Philosophical Maxims
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROVERBS_DATA.map((item) => (
              <div key={item.id} className="space-y-3 p-5 rounded-xl bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border hover:border-primary-400/30 transition-colors">
                <span className="badge badge-primary text-[10px]">
                  {item.originCulture} · {item.region}
                </span>
                
                <h4 className="font-serif text-lg md:text-xl italic text-gray-900 dark:text-white font-medium">
                  "{item.proverb}"
                </h4>

                <p className="font-sans text-xs text-primary-600 dark:text-accent-400 font-medium italic">
                  Translation: {item.translation}
                </p>

                <p className="font-sans text-xs text-gray-600 dark:text-gray-300 leading-relaxed pt-2 border-t border-sand-200 dark:border-dark-border">
                  <strong className="text-gray-900 dark:text-white font-mono text-[10px] uppercase tracking-wider block mb-1">
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
