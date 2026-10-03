import React from 'react'
import { ArrowUpRight, BookOpen, MapPin, Calendar, Bookmark } from 'lucide-react'
import { ArtifactItem } from '../../types/archiveTypes'
import { Badge } from '../ui/Badge'

export interface ArtifactCardProps {
  artifact: ArtifactItem
  onInspect: (artifact: ArtifactItem) => void
  isBookmarked?: boolean
  onToggleBookmark?: (artifact: ArtifactItem) => void
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({
  artifact,
  onInspect,
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const [imageError, setImageError] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)

  const showImage = Boolean(artifact.imageSrc && !imageError)

  return (
    <article className="card-hover flex flex-col justify-between overflow-hidden group">
      {/* Top Visual Container */}
      <div className="relative aspect-[4/3] w-full bg-sand-100 dark:bg-dark-bg overflow-hidden border-b border-sand-200 dark:border-dark-border">
        
        {/* Real Artifact Primary Image */}
        {showImage && (
          <img
            src={artifact.imageSrc}
            alt={artifact.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-out z-0 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Background Gradient & Scrim for Text Contrast */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-[1] pointer-events-none"
          aria-hidden="true"
        />

        {/* Thumbnail Graphic Visual */}
        <div className="relative w-full h-full p-4 flex flex-col justify-between select-none z-10">
          <div className="flex justify-between items-start">
            <span className="badge badge-primary shadow-sm backdrop-blur-md">
              {artifact.catalogNumber}
            </span>
            
            <div className="flex items-center space-x-2">
              {onToggleBookmark && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBookmark(artifact)
                  }}
                  type="button"
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark artifact'}
                  className={`p-1.5 rounded-lg bg-black/60 backdrop-blur-xs border transition-colors shadow-md ${
                    isBookmarked
                      ? 'border-accent-400 text-accent-400 fill-accent-400'
                      : 'border-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-accent-400' : ''}`} />
                </button>
              )}
              <span className="badge badge-gray text-[10px] backdrop-blur-md shadow-md">
                {artifact.regionLabel}
              </span>
            </div>
          </div>

          {/* Central Motif (shown when image is not present or loading/failed) */}
          {!showImage && (
            <div className="my-auto text-center py-2 z-10">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full border border-primary-400/40 bg-primary-900/30 flex items-center justify-center text-primary-300 group-hover:scale-110 transition-transform duration-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-serif italic text-xs text-white/90 line-clamp-1 px-2">
                "{artifact.title}"
              </span>
              <span className="font-mono text-[9px] text-white/60 uppercase tracking-widest mt-1 block">
                Archival Record
              </span>
            </div>
          )}

          <div className="flex justify-between items-end text-white/90 font-mono text-[10px] uppercase tracking-wider z-10 pt-2 border-t border-white/10 bg-black/60 -mx-4 -mb-4 px-4 py-2 backdrop-blur-xs">
            <span>{artifact.era}</span>
            <span className="text-accent-300 font-semibold">{artifact.category}</span>
          </div>
        </div>

        {/* Glass Highlight Overlay */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none z-20" />
      </div>

      {/* Card Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 font-mono text-xs">
            <Calendar className="w-3.5 h-3.5 text-primary-500" />
            <span>{artifact.dateRange}</span>
          </div>

          <h3 className="font-serif font-bold text-lg md:text-xl text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 leading-snug">
            {artifact.title}
          </h3>

          <p className="font-sans text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
            {artifact.summary}
          </p>
        </div>

        {/* Bottom Location & Inspect Action Button */}
        <div className="pt-3 border-t border-sand-200 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-gray-500 dark:text-gray-400 font-mono text-[11px] truncate max-w-[170px]">
            <MapPin className="w-3 h-3 text-primary-500 flex-shrink-0" />
            <span className="truncate">{artifact.originLocation}</span>
          </div>

          <button
            onClick={() => onInspect(artifact)}
            type="button"
            className="inline-flex items-center space-x-1 font-sans text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-accent-400 group-hover:underline transition-colors focus:outline-none p-1"
          >
            <span>PROVENANCE</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </article>
  )
}
