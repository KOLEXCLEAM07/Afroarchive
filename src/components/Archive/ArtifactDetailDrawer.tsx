import React, { useEffect } from 'react'
import { X, BookOpen, MapPin, Calendar, Landmark, ShieldCheck, FileText, Share2 } from 'lucide-react'
import { ArtifactItem } from '../../types/archiveTypes'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import ArtifactViewer3D from './ArtifactViewer3D'

export interface ArtifactDetailDrawerProps {
  artifact: ArtifactItem | null
  isOpen: boolean
  onClose: () => void
}

export const ArtifactDetailDrawer: React.FC<ArtifactDetailDrawerProps> = ({
  artifact,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !artifact) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Artifact provenance details for ${artifact.title}`}
      className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex justify-end animate-fade-in"
    >
      {/* Backdrop overlay click listener */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Slide-over Content Drawer Container */}
      <div className="relative w-full max-w-2xl bg-charcoal-900 border-l border-ivory-100/15 h-full overflow-y-auto shadow-museum z-10 p-6 md:p-10 flex flex-col justify-between space-y-8">
        
        {/* Drawer Header */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-ivory-100/10 pb-4">
            <div className="flex items-center space-x-3">
              <Badge variant="bronze" size="sm">
                {artifact.catalogNumber}
              </Badge>
              <span className="font-mono text-2xs uppercase tracking-widest text-ivory-400">
                PROVENANCE INSPECTOR
              </span>
            </div>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close details panel"
              className="p-1.5 text-ivory-400 hover:text-bronze-300 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Title & Date Header */}
          <div className="space-y-2">
            <span className="font-mono text-2xs uppercase text-bronze-400 tracking-widest">
              {artifact.regionLabel} · {artifact.era}
            </span>
            <h2 className="font-display font-semibold text-2xl md:text-3xl text-ivory-100">
              {artifact.title}
            </h2>
            {artifact.subtitle && (
              <p className="font-serif italic text-sm md:text-base text-bronze-300">
                {artifact.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Archival Vessel Visual — Immersive 3D Viewer */}
        {artifact.imageSrc ? (
          <div className="w-full flex justify-center py-4" style={{ background: '#161412' }}>
            <ArtifactViewer3D
              imageSrc={artifact.imageSrc}
              title={artifact.title}
              className="w-full"
            />
          </div>
        ) : (
          <div className="relative aspect-[16/9] w-full rounded bg-[#161412] border border-earth-700/40 flex flex-col justify-between overflow-hidden shadow-artifact">
            <div className="relative z-10 flex justify-between items-start p-6">
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-widest text-bronze-400">
                  ARCHIVAL ITEM
                </span>
                <span className="font-mono text-xs text-ivory-300">
                  {artifact.dateRange}
                </span>
              </div>
              <ShieldCheck className="w-5 h-5 text-bronze-400" />
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full border border-bronze-400/40 bg-burgundy-900/30 flex items-center justify-center text-bronze-300">
                  <BookOpen className="w-7 h-7" />
                </div>
                <p className="font-serif italic text-sm text-ivory-300 max-w-xs">
                  "{artifact.title}"
                </p>
                <p className="font-mono text-[10px] text-ivory-500 mt-2 uppercase tracking-widest">
                  Image not yet available
                </p>
              </div>
            </div>

            <div className="relative z-10 p-6 flex justify-between items-end text-ivory-400 font-mono text-[10px] uppercase">
              <span>REPOSITORY</span>
              <span className="text-bronze-300 font-medium">{artifact.repository}</span>
            </div>
          </div>
        )}

        {/* Core Metadata Table */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded bg-charcoal-850 border border-ivory-100/10">
          <div className="space-y-1">
            <span className="font-mono text-2xs uppercase tracking-wider text-ivory-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-bronze-400" /> Origin Location
            </span>
            <p className="font-sans text-xs text-ivory-200 font-medium">
              {artifact.originLocation}
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-2xs uppercase tracking-wider text-ivory-400 flex items-center gap-1">
              <Landmark className="w-3 h-3 text-bronze-400" /> Archival Repository
            </span>
            <p className="font-sans text-xs text-ivory-200 font-medium">
              {artifact.repository}
            </p>
          </div>
        </div>

        {/* Detailed Curatorial Text */}
        <div className="space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-bronze-400 border-b border-ivory-100/10 pb-2">
            Historical Context & Description
          </h3>
          <p className="font-sans text-sm md:text-base text-ivory-200 font-light leading-relaxed">
            {artifact.fullDescription}
          </p>
        </div>

        {/* Key Insights & Discoveries */}
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-bronze-400 border-b border-ivory-100/10 pb-2">
            Key Insights & Historical Significance
          </h3>
          <ul className="space-y-2">
            {artifact.keyInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start space-x-3 text-xs md:text-sm text-ivory-300">
                <span className="font-mono text-bronze-400 font-bold text-xs mt-0.5">0{idx + 1}.</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Primary Source Citations */}
        <div className="space-y-3 pt-2">
          <h3 className="font-mono text-xs uppercase tracking-widest text-bronze-400 border-b border-ivory-100/10 pb-2 flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-bronze-400" />
            <span>Primary Sources & References</span>
          </h3>
          <div className="space-y-1.5 font-mono text-xs text-ivory-400">
            {artifact.primarySources.map((source, idx) => (
              <div key={idx} className="p-2 rounded bg-charcoal-950 border border-ivory-100/5">
                • {source}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-ivory-100/10 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href)
              alert('Archival link copied to clipboard.')
            }}
          >
            SHARE PROVENANCE
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            CLOSE INSPECTOR
          </Button>
        </div>
      </div>
    </div>
  )
}
