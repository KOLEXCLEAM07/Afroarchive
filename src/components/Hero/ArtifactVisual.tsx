import React, { useState } from 'react'

export interface ArtifactVisualProps {
  imageSrc?: string
  artifactTitle?: string
  catalogNumber?: string
  originDate?: string
  originLocation?: string
  className?: string
}

export const ArtifactVisual: React.FC<ArtifactVisualProps> = ({
  imageSrc,
  artifactTitle = 'Timbuktu Astronomical & Mathematical Folio',
  catalogNumber = 'CAT. TBT-MS-1384',
  originDate = 'c. 1380 CE (8th Century AH)',
  originLocation = 'Sankoré University Archives, Timbuktu, Mali',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false)

  return (
    <div className={`relative w-full max-w-2xl mx-auto lg:max-w-none ${className}`}>
      {/* Backlight / Archival Exhibition Glow */}
      <div 
        className="absolute -inset-4 md:-inset-8 rounded-3xl opacity-40 blur-3xl pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(212, 160, 52, 0.25) 0%, rgba(107, 29, 29, 0.15) 50%, transparent 80%)'
        }}
        aria-hidden="true"
      />

      {/* Main Archival Vessel Container with Edge Bleed */}
      <div className="relative group">
        {/* Museum Exhibition Frame Plate */}
        <div className="relative rounded-lg bg-charcoal-850 p-2 md:p-3 border border-ivory-100/10 shadow-artifact overflow-hidden transform lg:translate-x-4 lg:-rotate-1 transition-transform duration-700 hover:rotate-0">
          
          {/* Subtle Archival Grid & Texture Backdrop */}
          <div className="relative aspect-[4/5] sm:aspect-[4/4.8] w-full rounded bg-[#161412] overflow-hidden border border-earth-700/40">
            
            {imageSrc && !imageError ? (
              <img
                src={imageSrc}
                alt={`${artifactTitle} - ${originLocation}`}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover object-center filter saturate-[0.9] contrast-[1.05] transition-transform duration-1000 group-hover:scale-105"
              />
            ) : (
              /* High-fidelity Art-Directed Archival Folio Visual: Timbuktu Manuscript */
              <div className="relative w-full h-full p-6 md:p-10 flex flex-col justify-between bg-gradient-to-b from-[#1c1814] via-[#15120f] to-[#0d0b09] text-ivory-200 select-none">
                
                {/* Parchment Base Texture Overlay */}
                <div 
                  className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none" 
                  style={{
                    backgroundImage: 'radial-gradient(circle at 70% 30%, #D4A034 0%, transparent 60%), radial-gradient(circle at 20% 80%, #6B1D1D 0%, transparent 50%)'
                  }}
                  aria-hidden="true"
                />

                {/* Top Folio Header & Registration Marks */}
                <div className="relative z-10 flex justify-between items-start border-b border-ivory-100/10 pb-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-2xs tracking-widest text-bronze-400/90 uppercase">
                      Archival Manuscript Folio
                    </span>
                    <span className="font-serif italic text-xs text-ivory-300">
                      {catalogNumber}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-bronze-400 animate-pulse" />
                    <span className="font-mono text-[10px] tracking-widest text-ivory-400 uppercase">
                      Verified Heritage
                    </span>
                  </div>
                </div>

                {/* Celestial Diagram & Manuscript Graphic (Authentic Timbuktu Astronomy Folio Visual Representation) */}
                <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center text-center">
                  
                  {/* Astronomical Concentric Diagram SVG */}
                  <div className="relative w-48 h-48 md:w-64 md:h-64 my-2">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-bronze-400/80">
                      {/* Outer Degree Marks Circle */}
                      <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
                      <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      <circle cx="100" cy="100" r="54" fill="none" stroke="#6B1D1D" strokeWidth="1.5" strokeOpacity="0.7" />
                      <circle cx="100" cy="100" r="32" fill="none" stroke="currentColor" strokeWidth="0.75" />

                      {/* Cardinal Lines & Equinoctial Coordinates */}
                      <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
                      <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
                      <line x1="36" y1="36" x2="164" y2="164" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.4" />
                      <line x1="164" y1="36" x2="36" y2="164" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" strokeOpacity="0.4" />

                      {/* Star Constellation Nodes */}
                      <circle cx="100" cy="46" r="3" fill="#D4A034" />
                      <circle cx="154" cy="100" r="2.5" fill="#D4A034" />
                      <circle cx="100" cy="154" r="3" fill="#D4A034" />
                      <circle cx="46" cy="100" r="2.5" fill="#D4A034" />
                      <circle cx="138" cy="62" r="2" fill="#F5F2EB" />
                      <circle cx="62" cy="138" r="2" fill="#F5F2EB" />
                    </svg>

                    {/* Central Ink Seal Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border border-bronze-400/50 bg-burgundy-900/40 flex items-center justify-center" style={{ backdropFilter: 'blur(2px)' }}>
                        <span className="font-serif italic text-xs text-bronze-300">AHMED</span>
                      </div>
                    </div>
                  </div>

                  {/* Classical Manuscript Calligraphy Representation (Sudani / Saharan Script) */}
                  <div className="w-full max-w-sm space-y-2 mt-4 text-center">
                    <p className="font-serif text-sm md:text-base italic text-ivory-200/90 tracking-wide leading-relaxed">
                      "Knowledge is a light which illumination reacheth unto the ends of the heavens."
                    </p>
                    <p className="font-mono text-2xs tracking-widest text-bronze-400/80 uppercase">
                      — Timbuktu Astronomy & Mathematics Treatise, Folio 141a
                    </p>
                  </div>
                </div>

                {/* Bottom Metadata & Curatorial Stamp */}
                <div className="relative z-10 pt-4 border-t border-ivory-100/10 flex justify-between items-end">
                  <div className="text-left space-y-0.5">
                    <div className="font-mono text-[10px] uppercase text-ivory-400 tracking-wider">
                      Origin & Period
                    </div>
                    <div className="font-sans text-xs text-ivory-200 font-medium">
                      {originDate}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-mono text-[10px] uppercase text-ivory-400 tracking-wider">
                      Location
                    </div>
                    <div className="font-sans text-xs text-bronze-300 font-medium">
                      Timbuktu, Mali
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Glass Highlight Edge Refraction */}
            <div className="absolute inset-0 ring-1 ring-inset ring-ivory-100/10 pointer-events-none rounded" />
          </div>

          {/* Floating Museum Exhibition Label Tag */}
          <div className="absolute -bottom-3 right-4 md:right-6 z-20 bg-charcoal-900/95 backdrop-blur-md px-4 py-2 border border-bronze-400/30 rounded-sm shadow-lg max-w-[240px] md:max-w-[280px]">
            <div className="font-mono text-[9px] uppercase tracking-widest text-bronze-400">
              Exhibition Item #01
            </div>
            <div className="font-serif text-xs md:text-sm text-ivory-100 font-medium truncate">
              {artifactTitle}
            </div>
            <div className="font-sans text-[10px] text-ivory-400 truncate">
              {originLocation}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
