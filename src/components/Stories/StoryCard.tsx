import React from 'react'
import { Quote, ArrowUpRight, BookOpen, Clock, User, Bookmark } from 'lucide-react'
import { StoryItem } from '../../types/storyTypes'
import { Badge } from '../ui/Badge'

export interface StoryCardProps {
  story: StoryItem
  onRead: (story: StoryItem) => void
  isBookmarked?: boolean
  onToggleBookmark?: (story: StoryItem) => void
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onRead,
  isBookmarked = false,
  onToggleBookmark,
}) => {
  return (
    <article className="card-hover flex flex-col justify-between p-6 md:p-8 overflow-hidden group">
      <div className="space-y-4 relative z-10">
        {/* Card Header Labels */}
        <div className="flex items-center justify-between">
          <span className="badge badge-primary">
            {story.categoryLabel}
          </span>
          
          <div className="flex items-center space-x-3">
            {onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleBookmark(story)
                }}
                type="button"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
                className={`p-1.5 rounded-lg bg-sand-100 dark:bg-dark-card border transition-colors ${
                  isBookmarked
                    ? 'border-accent-400 text-accent-500 fill-accent-500'
                    : 'border-sand-200 dark:border-dark-border text-gray-400 hover:text-primary-500'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-accent-400' : ''}`} />
              </button>
            )}
            
            <div className="flex items-center space-x-1 text-xs text-gray-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-primary-500" />
              <span>{story.readingTime}</span>
            </div>
          </div>
        </div>

        {/* Quote Highlight Box */}
        <div className="p-4 rounded-xl bg-sand-50 dark:bg-dark-surface border-l-2 border-primary-500 space-y-1">
          <Quote className="w-4 h-4 text-primary-600 dark:text-accent-400" />
          <p className="font-serif italic text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
            "{story.quote}"
          </p>
        </div>

        {/* Title & Author/Thinker */}
        <div className="space-y-1">
          <span className="text-xs font-mono text-primary-600 dark:text-accent-400 uppercase tracking-wider block">
            {story.thinkerOrGriot} · {story.era}
          </span>
          <h3 className="font-serif font-bold text-xl text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {story.title}
          </h3>
        </div>

        <p className="font-sans text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
          {story.excerpt}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 mt-6 border-t border-sand-200 dark:border-dark-border flex items-center justify-between relative z-10">
        <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
          {story.region}
        </span>

        <button
          onClick={() => onRead(story)}
          type="button"
          className="inline-flex items-center space-x-1 font-sans text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-accent-400 group-hover:underline transition-colors focus:outline-none p-1"
        >
          <span>READ PHILOSOPHY</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
        </button>
      </div>
    </article>
  )
}
