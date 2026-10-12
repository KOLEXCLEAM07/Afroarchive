import React, { useState } from 'react'

export interface ArtifactVisualProps {
  imageSrc?: string
  artifactTitle?: string
  originDate?: string
  originLocation?: string
  /** Photo credit shown under the frame when a real image is used. */
  credit?: string
  className?: string
}

export const ArtifactVisual: React.FC<ArtifactVisualProps> = ({
  imageSrc,
  artifactTitle = 'Timbuktu manuscripts',
  originDate = '13th–20th centuries',
  originLocation = 'Timbuktu, Mali',
  credit,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false)

  return (
    <div className={`relative w-full max-w-2xl mx-auto lg:max-w-none ${className}`}>
      {/* Main Archival Vessel Container */}
      <div className="relative group">
        {/* Museum Exhibition Frame Plate */}
        <div className="relative rounded-2xl bg-dark-surface p-2 md:p-3 border border-white/10 shadow-xl overflow-hidden">

          <div className={`relative w-full rounded-xl bg-dark-card overflow-hidden border border-white/5 ${imageSrc && !imageError ? 'aspect-[4/3]' : 'aspect-[4/5] sm:aspect-[4/4.8]'}`}>

            {imageSrc && !imageError ? (
              <img
                src={imageSrc}
                alt={`${artifactTitle}, ${originLocation}`}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              /* Art-Directed Archival Folio Visual: Timbuktu Manuscript */
              <div className="relative w-full h-full p-6 md:p-10 flex flex-col justify-between bg-dark-card text-ivory-200 select-none">

                {/* Top Folio Header */}
                <div className="relative z-10 flex justify-between items-start border-b border-white/10 pb-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="eyebrow">
                      Timbuktu manuscripts · Mali
                    </span>
                    <span className="font-serif italic text-sm text-ivory-400">
                      Illustration, not a reproduction
                    </span>
                  </div>
                </div>

                {/* Decorative astronomical diagram (illustrative only) */}
                <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center text-center">

                  <div className="relative w-48 h-48 md:w-64 md:h-64 my-2">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-accent-400/70" aria-hidden="true">
                      <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
                      <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      <circle cx="100" cy="100" r="54" fill="none" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.5" />
                      <circle cx="100" cy="100" r="32" fill="none" stroke="currentColor" strokeWidth="0.75" />

                      <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
                      <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
                      <line x1="36" y1="36" x2="164" y2="164" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.4" />
                      <line x1="164" y1="36" x2="36" y2="164" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.4" />

                      <circle cx="100" cy="46" r="3" fill="#D4A034" />
                      <circle cx="154" cy="100" r="2.5" fill="#D4A034" />
                      <circle cx="100" cy="154" r="3" fill="#D4A034" />
                      <circle cx="46" cy="100" r="2.5" fill="#D4A034" />
                      <circle cx="138" cy="62" r="2" fill="#F5F2EB" />
                      <circle cx="62" cy="138" r="2" fill="#F5F2EB" />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border border-accent-400/40 bg-dark-surface flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-accent-300" aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-sm space-y-2 mt-4 text-center">
                    <p className="font-serif text-base md:text-lg italic text-ivory-200 leading-relaxed">
                      Thousands of manuscripts survive in family libraries and at the Ahmed Baba Institute.
                    </p>
                    <p className="text-xs text-accent-300">
                      Astronomy · Law · Medicine · Poetry
                    </p>
                  </div>
                </div>

                {/* Bottom Metadata */}
                <div className="relative z-10 pt-4 border-t border-white/10 flex justify-between items-end">
                  <div className="text-left space-y-0.5">
                    <div className="text-xs text-ivory-400">
                      Period
                    </div>
                    <div className="text-sm text-ivory-200 font-medium">
                      {originDate}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-xs text-ivory-400">
                      Location
                    </div>
                    <div className="text-sm text-accent-300 font-medium">
                      {originLocation}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Museum Exhibition Label Tag */}
          <div className="absolute bottom-5 right-5 md:right-7 z-20 bg-dark-surface/95 backdrop-blur-md px-4 py-2.5 border border-white/10 rounded-xl shadow-lg max-w-[240px] md:max-w-[280px]">
            <div className="text-xs font-semibold text-accent-300">
              Featured collection
            </div>
            <div className="font-serif text-base text-white font-bold truncate">
              {artifactTitle}
            </div>
            <div className="text-xs text-ivory-400 truncate">
              {originLocation}
            </div>
          </div>
        </div>
      </div>
      {credit && imageSrc && !imageError && (
        <p className="mt-2 text-xs text-ivory-500 text-right">{credit}</p>
      )}
    </div>
  )
}
