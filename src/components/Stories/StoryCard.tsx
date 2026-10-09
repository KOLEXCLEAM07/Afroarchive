import React from 'react'
import { Quote, ArrowUpRight, Clock, Bookmark } from 'lucide-react'
import { StoryItem } from '../../types/storyTypes'

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
    <article className="card-hover rounded-2xl flex flex-col justify-between p-6 md:p-7 overflow-hidden group">
      <div className="space-y-4 relative z-10">
        {/* Card Header Labels */}
        <div className="flex items-center justify-between">
          <span className="badge badge-accent">
            {story.categoryLabel}
          </span>
          
          <div className="flex items-center gap-3">
            {onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleBookmark(story)
                }}
                type="button"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
                className={`p-1.5 rounded-full bg-white/5 border transition-colors ${
                  isBookmarked
                    ? 'border-accent-400 text-accent-400'
                    : 'border-white/10 text-ivory-400 hover:text-white hover:border-white/25'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-accent-400' : ''}`} />
              </button>
            )}
            
            <div className="flex items-center gap-1 text-xs text-ivory-400">
              <Clock className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
              <span>{story.readingTime}</span>
            </div>
          </div>
        </div>

        {/* Quote Highlight Box */}
        <div className="p-4 rounded-xl bg-dark-surface border-l-2 border-accent-400/70 space-y-1">
          <Quote className="w-4 h-4 text-accent-400" aria-hidden="true" />
          <p className="font-serif italic text-base text-ivory-200 line-clamp-2">
            "{story.quote}"
          </p>
        </div>

        {/* Title & Author/Thinker */}
        <div className="space-y-1">
          <span className="text-xs text-accent-300 block">
            {story.thinkerOrGriot} · {story.era}
          </span>
          <h3 className="font-serif font-bold text-xl text-white group-hover:text-accent-300 transition-colors">
            {story.title}
          </h3>
        </div>

        <p className="text-sm text-ivory-400 leading-relaxed line-clamp-3">
          {story.excerpt}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between gap-3 relative z-10">
        <span className="text-xs text-ivory-400 truncate">
          {story.region}
        </span>

        <button
          onClick={() => onRead(story)}
          type="button"
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg text-sm font-semibold text-accent-300 hover:text-accent-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 px-1.5 py-1"
        >
          <span>Read philosophy</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
