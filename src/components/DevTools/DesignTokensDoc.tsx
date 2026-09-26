import React from 'react'
import { tokens } from '../../styles/tokens'

/**
 * Dev-Only Design System & Tokens Documentation Component.
 * Accessible strictly when ?dev=true is present in the URL or via internal dev toggle.
 * Will NOT render on the public-facing homepage for normal visitors.
 */
export const DesignTokensDoc: React.FC = () => {
  return (
    <div className="bg-charcoal-950 text-ivory-100 p-8 max-w-6xl mx-auto my-12 rounded-lg border border-bronze-400/30 font-sans shadow-museum">
      <div className="border-b border-ivory-100/10 pb-6 mb-8 flex justify-between items-center">
        <div>
          <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
            INTERNAL DEVELOPER TOOLING
          </span>
          <h2 className="font-display text-3xl font-bold text-ivory-100 mt-1">
            AFROARCHIVE — Design Tokens System
          </h2>
        </div>
        <div className="font-mono text-xs text-ivory-400 bg-charcoal-800 px-3 py-1.5 rounded border border-charcoal-700">
          Stage 1 Foundation Tokens
        </div>
      </div>

      {/* Palette Tokens */}
      <section className="space-y-4 mb-10">
        <h3 className="font-mono text-xs uppercase tracking-widest text-bronze-400 border-b border-ivory-100/10 pb-2">
          Color Tokens Palette
        </h3>
        
        {/* Charcoal Shades */}
        <div>
          <h4 className="font-mono text-2xs text-ivory-400 uppercase mb-2">Charcoal & Canvas</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {Object.entries(tokens.colors.charcoal).map(([key, hex]) => (
              <div key={key} className="flex flex-col space-y-1">
                <div className="h-12 rounded border border-ivory-100/10" style={{ backgroundColor: hex }} />
                <span className="font-mono text-[10px] text-ivory-300">charcoal-{key}</span>
                <span className="font-mono text-[9px] text-ivory-500">{hex}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ivory & Parchment */}
        <div className="pt-4">
          <h4 className="font-mono text-2xs text-ivory-400 uppercase mb-2">Ivory & Warm Paper</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Object.entries(tokens.colors.ivory).map(([key, hex]) => (
              <div key={key} className="flex flex-col space-y-1">
                <div className="h-12 rounded border border-charcoal-700" style={{ backgroundColor: hex }} />
                <span className="font-mono text-[10px] text-ivory-300">ivory-{key}</span>
                <span className="font-mono text-[9px] text-ivory-500">{hex}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bronze Accents */}
        <div className="pt-4">
          <h4 className="font-mono text-2xs text-ivory-400 uppercase mb-2">Bronze & Ochre Accents</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Object.entries(tokens.colors.bronze).map(([key, hex]) => (
              <div key={key} className="flex flex-col space-y-1">
                <div className="h-12 rounded border border-ivory-100/10" style={{ backgroundColor: hex }} />
                <span className="font-mono text-[10px] text-ivory-300">bronze-{key}</span>
                <span className="font-mono text-[9px] text-ivory-500">{hex}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Typography Tokens */}
      <section className="space-y-4">
        <h3 className="font-mono text-xs uppercase tracking-widest text-bronze-400 border-b border-ivory-100/10 pb-2">
          Typography Scale & Families
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="font-mono text-2xs text-ivory-400 uppercase">Cinzel (Display Serif)</span>
            <p className="font-display text-2xl text-ivory-100">AFROARCHIVE KNOWLEDGE</p>
          </div>
          <div className="space-y-2">
            <span className="font-mono text-2xs text-ivory-400 uppercase">Cormorant Garamond (Editorial Serif)</span>
            <p className="font-serif text-2xl italic text-bronze-300">Preserved for the Future</p>
          </div>
          <div className="space-y-2">
            <span className="font-mono text-2xs text-ivory-400 uppercase">Plus Jakarta Sans (Body Sans)</span>
            <p className="font-sans text-sm text-ivory-200">Explore histories, ideas, and indigenous philosophies.</p>
          </div>
          <div className="space-y-2">
            <span className="font-mono text-2xs text-ivory-400 uppercase">JetBrains Mono (Metadata Monospace)</span>
            <p className="font-mono text-xs text-bronze-400">CAT. TBT-MS-1384 · c. 1380 CE</p>
          </div>
        </div>
      </section>
    </div>
  )
}
