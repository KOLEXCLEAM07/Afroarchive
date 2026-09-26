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
    <article className="group relative flex flex-col justify-between bg-charcoal-850 rounded-lg border border-ivory-100/10 hover:border-bronze-400/50 shadow-museum hover:shadow-artifact transition-all duration-500 overflow-hidden transform hover:-translate-y-1">
      {/* Top Visual Container */}
      <div className="relative aspect-[4/3] w-full bg-[#161412] overflow-hidden border-b border-ivory-100/10">
        
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
          className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/20 to-transparent z-[1] pointer-events-none"
          aria-hidden="true"
        />

        {/* Thumbnail Graphic Visual */}
        <div className="relative w-full h-full p-4 flex flex-col justify-between select-none z-10">
          <div className="flex justify-between items-start">
            <Badge variant="bronze" size="sm" className="shadow-md backdrop-blur-md bg-charcoal-900/80">
              {artifact.catalogNumber}
            </Badge>
            
            <div className="flex items-center space-x-2">
              {onToggleBookmark && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBookmark(artifact)
                  }}
                  type="button"
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark artifact'}
                  className={`p-1.5 rounded bg-charcoal-900/80 backdrop-blur-xs border transition-colors shadow-md ${
                    isBookmarked
                      ? 'border-bronze-400 text-bronze-400 fill-bronze-400'
                      : 'border-ivory-100/10 text-ivory-400 hover:text-bronze-300'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-bronze-400' : ''}`} />
                </button>
              )}
              <span className="font-mono text-[10px] text-ivory-300 uppercase tracking-widest bg-charcoal-900/85 backdrop-blur-md px-2 py-1 rounded border border-ivory-100/15 shadow-md">
                {artifact.regionLabel}
              </span>
            </div>
          </div>

          {/* Central Motif (shown when image is not present or loading/failed) */}
          {!showImage && (
            <div className="my-auto text-center py-2 z-10">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full border border-bronze-400/40 bg-burgundy-900/30 flex items-center justify-center text-bronze-300 group-hover:scale-110 group-hover:border-bronze-400 transition-transform duration-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-serif italic text-xs text-ivory-300 line-clamp-1 px-2">
                "{artifact.title}"
              </span>
              <span className="font-mono text-[9px] text-ivory-500 uppercase tracking-widest mt-1 block">
                Archival Record
              </span>
            </div>
          )}

          <div className="flex justify-between items-end text-ivory-300 font-mono text-[10px] uppercase tracking-wider z-10 pt-2 border-t border-ivory-100/10 bg-charcoal-950/60 -mx-4 -mb-4 px-4 py-2 backdrop-blur-xs">
            <span>{artifact.era}</span>
            <span className="text-bronze-400 font-semibold">{artifact.category}</span>
          </div>
        </div>

        {/* Glass Highlight Overlay */}
        <div className="absolute inset-0 ring-1 ring-inset ring-ivory-100/10 pointer-events-none z-20" />
      </div>

      {/* Card Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-ivory-400 font-mono text-2xs">
            <Calendar className="w-3.5 h-3.5 text-bronze-400" />
            <span>{artifact.dateRange}</span>
          </div>

          <h3 className="font-display font-semibold text-lg md:text-xl text-ivory-100 group-hover:text-bronze-300 transition-colors duration-300 leading-snug">
            {artifact.title}
          </h3>

          <p className="font-sans text-xs text-ivory-300 font-light line-clamp-3 leading-relaxed">
            {artifact.summary}
          </p>
        </div>

        {/* Bottom Location & Inspect Action Button */}
        <div className="pt-3 border-t border-ivory-100/10 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-ivory-400 font-mono text-[10px] truncate max-w-[170px]">
            <MapPin className="w-3 h-3 text-bronze-400 flex-shrink-0" />
            <span className="truncate">{artifact.originLocation}</span>
          </div>

          <button
            onClick={() => onInspect(artifact)}
            type="button"
            className="inline-flex items-center space-x-1 font-sans text-2xs font-semibold uppercase tracking-widest text-bronze-400 group-hover:text-bronze-300 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400 p-1"
          >
            <span>PROVENANCE</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </article>
  )
}
