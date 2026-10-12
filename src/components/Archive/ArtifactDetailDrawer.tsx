import React from 'react'
import { Link } from 'react-router-dom'
import { X, BookOpen, MapPin, Landmark, FileText, Share2, ArrowUpRight } from 'lucide-react'
import { ArtifactItem } from '../../types/archiveTypes'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import Model3DViewer from '../museum/Model3DViewer'
import { useModalStack } from '../../hooks/useScrollLock'
import { shareLink } from '../museum/shareLink'

export interface ArtifactDetailDrawerProps {
  artifact: ArtifactItem | null
  isOpen: boolean
  onClose: () => void
}

const isUrl = (value: string) => /^https?:\/\//i.test(value)

export const ArtifactDetailDrawer: React.FC<ArtifactDetailDrawerProps> = ({
  artifact,
  isOpen,
  onClose,
}) => {
  const open = isOpen && !!artifact
  const panelRef = useModalStack<HTMLDivElement>(open, onClose)

  if (!open || !artifact) return null

  const handleShare = () => {
    const path = artifact.recordSlug
      ? `/article/${artifact.recordSlug}`
      : `/museum?artifact=${encodeURIComponent(artifact.id)}`
    shareLink(`${window.location.origin}${path}`, artifact.title)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="artifact-drawer-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
    >
      {/* Backdrop overlay click listener */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Slide-over Content Drawer Container */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl bg-dark-surface border border-white/10 rounded-l-2xl h-full overflow-y-auto shadow-2xl z-10 p-6 md:p-10 flex flex-col justify-between space-y-8 outline-none"
      >
        
        {/* Drawer Header */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Badge variant="bronze" size="sm" className="font-mono normal-case tracking-normal truncate">
                {artifact.catalogNumber}
              </Badge>
              <span className="text-xs text-ivory-400">
                Object details
              </span>
            </div>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close details panel"
              className="p-2 rounded-lg text-ivory-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Title & Date Header */}
          <div className="space-y-2">
            <span className="eyebrow">
              {artifact.regionLabel} · {artifact.era}
            </span>
            <h2 id="artifact-drawer-title" className="heading-lg text-white">
              {artifact.title}
            </h2>
            {artifact.subtitle && (
              <p className="font-serif italic text-base md:text-lg text-accent-300">
                {artifact.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Archival Vessel Visual */}
        {artifact.model3d ? (
          <Model3DViewer model={artifact.model3d} title={artifact.title} credit={artifact.model3d.credit} />
        ) : artifact.imageSrc ? (
          <figure className="w-full overflow-hidden rounded-2xl border border-white/10 bg-dark-card">
            <img
              src={artifact.imageSrc}
              alt={artifact.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[28rem] object-contain"
            />
          </figure>
        ) : (
          <div className="relative aspect-[16/9] w-full rounded-2xl bg-dark-card border border-white/10 flex flex-col justify-between overflow-hidden">
            <div className="relative z-10 flex justify-between items-start p-6">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-accent-300">
                  Archival item
                </span>
                <span className="text-xs text-ivory-300">
                  {artifact.dateRange}
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full border border-accent-400/40 bg-dark-surface flex items-center justify-center text-accent-300">
                  <BookOpen className="w-7 h-7" aria-hidden="true" />
                </div>
                <p className="font-serif italic text-base text-ivory-300 max-w-xs">
                  "{artifact.title}"
                </p>
                <p className="text-xs text-ivory-500 mt-2">
                  No image available
                </p>
              </div>
            </div>

            <div className="relative z-10 p-6 flex justify-between items-end text-ivory-400 text-xs">
              <span>Source</span>
              <span className="text-accent-300 font-medium">{artifact.repository}</span>
            </div>
          </div>
        )}

        {/* Core Metadata Table */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-dark-card border border-white/10">
          <div className="space-y-1">
            <span className="text-xs text-ivory-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" /> Origin location
            </span>
            <p className="text-sm text-ivory-100 font-medium">
              {artifact.originLocation}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-ivory-400 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" /> Held by / source
            </span>
            <p className="text-sm text-ivory-100 font-medium">
              {artifact.repository}
            </p>
          </div>
        </div>

        {/* Detailed Curatorial Text */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-xl text-white border-b border-white/10 pb-2">
            Historical context & description
          </h3>
          <p className="text-sm md:text-base text-ivory-300 leading-relaxed whitespace-pre-line">
            {artifact.fullDescription}
          </p>
        </div>

        {/* Key Insights */}
        {artifact.keyInsights.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-xl text-white border-b border-white/10 pb-2">
              {artifact.recordSlug ? 'Credit & licence' : 'Key insights & historical significance'}
            </h3>
            <ul className="space-y-2">
              {artifact.keyInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-ivory-300">
                  <span className="font-mono text-accent-400 font-semibold text-xs mt-0.5">0{idx + 1}.</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Primary Source Citations */}
        {artifact.primarySources.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-serif font-bold text-xl text-white border-b border-white/10 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-400" aria-hidden="true" />
              <span>Sources & references</span>
            </h3>
            <div className="space-y-1.5 text-sm text-ivory-400">
              {artifact.primarySources.map((source, idx) => (
                <div key={idx} className="px-3 py-2 rounded-lg bg-dark-card border border-white/5 break-words">
                  {isUrl(source) ? (
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-300 hover:text-accent-300 underline underline-offset-2"
                    >
                      {source}
                    </a>
                  ) : (
                    <>• {source}</>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <span className="inline-flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              Share
            </span>
          </Button>

          <div className="flex items-center gap-3">
            {artifact.recordSlug && (
              <Link
                to={`/article/${artifact.recordSlug}`}
                onClick={onClose}
                className="btn btn-outline btn-sm gap-2"
              >
                <span>Open full record</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
