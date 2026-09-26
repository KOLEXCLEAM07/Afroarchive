import React, { useEffect } from 'react'
import { X, Quote, BookOpen, Clock, User, Volume2, Share2, FileText, Sparkles } from 'lucide-react'
import { StoryItem } from '../../types/storyTypes'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export interface StoryReaderModalProps {
  story: StoryItem | null
  isOpen: boolean
  onClose: () => void
}

export const StoryReaderModal: React.FC<StoryReaderModalProps> = ({ story, isOpen, onClose }) => {
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

  if (!isOpen || !story) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Read story: ${story.title}`}
      className="fixed inset-0 z-50 bg-charcoal-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in"
    >
      {/* Background click listener */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Reader Modal Container */}
      <div className="relative w-full max-w-4xl bg-charcoal-900 border border-ivory-100/15 rounded-lg shadow-museum h-full max-h-[90vh] overflow-y-auto z-10 p-6 sm:p-10 md:p-12 space-y-8">
        
        {/* Reader Header */}
        <div className="flex justify-between items-start border-b border-ivory-100/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Badge variant="bronze" size="sm">
                {story.categoryLabel}
              </Badge>
              <span className="font-mono text-2xs uppercase tracking-widest text-ivory-400">
                {story.region} · {story.era}
              </span>
            </div>

            <h2 className="font-display font-semibold text-2xl md:text-4xl text-ivory-100 leading-tight">
              {story.title}
            </h2>

            {story.subtitle && (
              <p className="font-serif italic text-base md:text-lg text-bronze-300">
                {story.subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close reader modal"
            className="p-2 text-ivory-400 hover:text-bronze-300 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Audio Narrator Bar & Metadata Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded bg-charcoal-850 border border-ivory-100/10">
          <div className="flex items-center space-x-3 text-ivory-300 font-mono text-xs">
            <User className="w-4 h-4 text-bronze-400" />
            <span>ATTRIBUTION: <strong className="text-ivory-100">{story.thinkerOrGriot}</strong></span>
          </div>

          <button
            onClick={() => alert(`Playing audio narration for "${story.title}"...`)}
            type="button"
            className="inline-flex items-center space-x-2 text-xs font-mono text-bronze-300 bg-bronze-900/40 border border-bronze-400/30 px-3.5 py-1.5 rounded hover:bg-bronze-400 hover:text-charcoal-950 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>LISTEN TO NARRATION ({story.readingTime})</span>
          </button>
        </div>

        {/* Featured Proverb / Quote Banner */}
        <div className="p-6 rounded bg-charcoal-850 border-l-4 border-bronze-400 space-y-2">
          <Quote className="w-6 h-6 text-bronze-400" />
          <blockquote className="font-serif text-lg md:text-xl italic text-ivory-100 leading-relaxed">
            "{story.quote}"
          </blockquote>
        </div>

        {/* Main Narrative Content */}
        <div className="space-y-6 text-ivory-200 font-sans text-base md:text-lg font-light leading-relaxed">
          {story.fullContent.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Historical Context & Scholar Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-ivory-100/10">
          <div className="p-5 rounded bg-charcoal-850 border border-ivory-100/10 space-y-2">
            <h4 className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
              HISTORICAL CONTEXT
            </h4>
            <p className="font-sans text-xs text-ivory-300 font-light leading-relaxed">
              {story.historicalContext}
            </p>
          </div>

          <div className="p-5 rounded bg-charcoal-850 border border-ivory-100/10 space-y-2">
            <h4 className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
              SCHOLARLY ANALYSIS
            </h4>
            <p className="font-sans text-xs text-ivory-300 font-light leading-relaxed">
              {story.scholarNotes}
            </p>
          </div>
        </div>

        {/* Primary Archival Sources */}
        <div className="space-y-3 pt-2">
          <h4 className="font-mono text-2xs uppercase tracking-widest text-bronze-400 flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-bronze-400" />
            <span>PRIMARY SOURCES & REFERENCES</span>
          </h4>
          <div className="space-y-1.5 font-mono text-xs text-ivory-400">
            {story.primarySources.map((source, idx) => (
              <div key={idx} className="p-2.5 rounded bg-charcoal-950 border border-ivory-100/5">
                • {source}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-6 border-t border-ivory-100/10 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href)
              alert('Philosophy link copied to clipboard.')
            }}
          >
            SHARE PHILOSOPHY
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            CLOSE READER
          </Button>
        </div>
      </div>
    </div>
  )
}
