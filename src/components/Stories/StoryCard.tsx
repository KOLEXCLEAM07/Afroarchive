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
    <article className="group relative flex flex-col justify-between bg-charcoal-850 rounded-lg border border-ivory-100/10 hover:border-bronze-400/50 p-6 md:p-8 shadow-museum hover:shadow-artifact transition-all duration-500 overflow-hidden transform hover:-translate-y-1">
      {/* Background Subtle Vignette Glow */}
      <div 
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-bronze-400/5 blur-2xl pointer-events-none group-hover:bg-bronze-400/15 transition-all duration-700" 
        aria-hidden="true" 
      />

      <div className="space-y-4 relative z-10">
        {/* Card Header Labels */}
        <div className="flex items-center justify-between">
          <Badge variant="bronze" size="sm">
            {story.categoryLabel}
          </Badge>
          
          <div className="flex items-center space-x-3">
            {onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleBookmark(story)
                }}
                type="button"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
                className={`p-1.5 rounded bg-charcoal-900 border transition-colors ${
                  isBookmarked
                    ? 'border-bronze-400 text-bronze-400 fill-bronze-400'
                    : 'border-ivory-100/10 text-ivory-400 hover:text-bronze-300'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-bronze-400' : ''}`} />
              </button>
            )}
            
            <div className="flex items-center space-x-1.5 font-mono text-2xs text-ivory-400">
              <Clock className="w-3.5 h-3.5 text-bronze-400" />
              <span>{story.readingTime}</span>
            </div>
          </div>
        </div>

        {/* Quote Highlight Box */}
        <div className="p-4 rounded bg-charcoal-950/80 border-l-2 border-bronze-400 space-y-1">
          <Quote className="w-4 h-4 text-bronze-400/80" />
          <p className="font-serif italic text-xs md:text-sm text-ivory-200 line-clamp-2">
            "{story.quote}"
          </p>
        </div>

        {/* Title & Author/Thinker */}
        <div className="space-y-1.5">
          <span className="font-mono text-[10px] text-bronze-300 uppercase tracking-widest block">
            {story.thinkerOrGriot} · {story.era}
          </span>
          <h3 className="font-display font-semibold text-xl text-ivory-100 group-hover:text-bronze-300 transition-colors duration-300">
            {story.title}
          </h3>
        </div>

        <p className="font-sans text-xs text-ivory-300 font-light leading-relaxed line-clamp-3">
          {story.excerpt}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-6 mt-6 border-t border-ivory-100/10 flex items-center justify-between relative z-10">
        <span className="font-mono text-[10px] text-ivory-400 uppercase tracking-wider">
          {story.region}
        </span>

        <button
          onClick={() => onRead(story)}
          type="button"
          className="inline-flex items-center space-x-1 font-sans text-2xs font-semibold uppercase tracking-widest text-bronze-400 group-hover:text-bronze-300 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400 p-1"
        >
          <span>READ PHILOSOPHY</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
        </button>
      </div>
    </article>
  )
}
