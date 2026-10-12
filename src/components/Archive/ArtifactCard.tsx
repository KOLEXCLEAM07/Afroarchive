import React from 'react'
import { ArrowUpRight, BookOpen, MapPin, Calendar, Bookmark, Box } from 'lucide-react'
import { ArtifactItem } from '../../types/archiveTypes'

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
    <article className="card-hover rounded-2xl flex flex-col justify-between overflow-hidden group">
      {/* Top Visual Container */}
      <div className="relative aspect-[4/3] w-full bg-dark-card overflow-hidden border-b border-white/10">
        
        {/* Real Artifact Primary Image */}
        {showImage && (
          <img
            src={artifact.imageSrc}
            alt={artifact.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.03] transition-all duration-700 ease-out z-0 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Background Gradient & Scrim for Text Contrast */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-[1] pointer-events-none"
          aria-hidden="true"
        />

        {/* Thumbnail Graphic Visual */}
        <div className="relative w-full h-full p-4 flex flex-col justify-between select-none z-10">
          <div className="flex justify-between items-start gap-2">
            {/* Catalogue numbers are useful for museum objects; imported records carry their source on the detail page instead. */}
            {!artifact.recordSlug ? (
              <span className="rounded-full bg-black/60 border border-white/10 px-2.5 py-0.5 font-mono text-[11px] text-ivory-100 backdrop-blur-md max-w-[55%] truncate">
                {artifact.catalogNumber}
              </span>
            ) : <span />}

            <div className="flex items-center gap-2">
              {onToggleBookmark && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBookmark(artifact)
                  }}
                  type="button"
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark artifact'}
                  className={`p-1.5 rounded-full bg-black/60 backdrop-blur-xs border transition-colors ${
                    isBookmarked
                      ? 'border-accent-400 text-accent-400 fill-accent-400'
                      : 'border-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-accent-400' : ''}`} />
                </button>
              )}
              {artifact.model3d && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-400 px-2.5 py-0.5 text-[11px] font-semibold text-charcoal-950">
                  <Box className="w-3 h-3" aria-hidden="true" /> 3D
                </span>
              )}
              {artifact.regionLabel && (
                <span className="rounded-full bg-black/60 border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-ivory-100 backdrop-blur-md">
                  {artifact.regionLabel}
                </span>
              )}
            </div>
          </div>

          {/* Central Motif (shown when image is not present or loading/failed) */}
          {!showImage && (
            <div className="my-auto text-center py-2 z-10">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full border border-accent-400/40 bg-dark-surface flex items-center justify-center text-accent-300">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="font-serif italic text-sm text-white/90 line-clamp-1 px-2">
                "{artifact.title}"
              </span>
              <span className="text-[11px] text-white/60 mt-1 block">
                Archival record
              </span>
            </div>
          )}

          <div className="flex justify-between items-end text-white/90 text-xs z-10 -mx-4 -mb-4 px-4 py-2.5">
            <span>{artifact.era}</span>
            <span className="text-accent-300 font-semibold capitalize ml-auto">{artifact.category}</span>
          </div>
        </div>

        {/* Glass Highlight Overlay */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none z-20" />
      </div>

      {/* Card Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {artifact.dateRange && (
            <div className="flex items-center gap-2 text-ivory-400 text-xs">
              <Calendar className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
              <span>{artifact.dateRange}</span>
            </div>
          )}

          <h3 className="font-serif font-bold text-lg md:text-xl text-white group-hover:text-accent-300 transition-colors duration-300 leading-snug">
            {artifact.title}
          </h3>

          <p className="text-sm text-ivory-400 leading-relaxed line-clamp-3">
            {artifact.summary}
          </p>
        </div>

        {/* Bottom Location & Inspect Action Button */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          {artifact.originLocation && (
            <div className="flex items-center gap-1.5 text-ivory-400 text-xs truncate max-w-[170px]">
              <MapPin className="w-3 h-3 text-accent-400 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{artifact.originLocation}</span>
            </div>
          )}

          <button
            onClick={() => onInspect(artifact)}
            type="button"
            className="ml-auto inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-accent-300 hover:text-accent-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 px-1.5 py-1"
          >
            <span>Provenance</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}
