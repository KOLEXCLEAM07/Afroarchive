import React, { useEffect, useState } from 'react'
import { X, Quote, User, Volume2, Square, Share2, FileText } from 'lucide-react'
import { StoryItem } from '../../types/storyTypes'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { useModalStack } from '../../hooks/useScrollLock'
import { shareLink } from '../museum/shareLink'

export interface StoryReaderModalProps {
  story: StoryItem | null
  isOpen: boolean
  onClose: () => void
}

const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export const StoryReaderModal: React.FC<StoryReaderModalProps> = ({ story, isOpen, onClose }) => {
  const open = isOpen && !!story
  const panelRef = useModalStack<HTMLDivElement>(open, onClose)
  const [speaking, setSpeaking] = useState(false)

  // Stop narration when the reader closes or the story changes
  useEffect(() => {
    return () => {
      if (speechSupported) window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [open, story?.id])

  if (!open || !story) return null

  const toggleNarration = () => {
    if (!speechSupported) return
    const synth = window.speechSynthesis
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    synth.cancel()
    const text = [story.title, story.quote, story.fullContent].join('\n\n')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    synth.speak(utterance)
    setSpeaking(true)
  }

  const handleShare = () => {
    shareLink(`${window.location.origin}/museum?story=${encodeURIComponent(story.id)}`, story.title)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-reader-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in"
    >
      {/* Background click listener */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Reader Modal Container */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-3xl bg-dark-surface border border-white/10 rounded-2xl shadow-2xl h-full max-h-[90vh] overflow-y-auto z-10 p-6 sm:p-10 md:p-12 space-y-8 outline-none"
      >
        
        {/* Reader Header */}
        <div className="flex justify-between items-start gap-4 border-b border-white/10 pb-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="bronze" size="sm">
                {story.categoryLabel}
              </Badge>
              <span className="text-xs text-ivory-400">
                {story.region} · {story.era}
              </span>
            </div>

            <h2 id="story-reader-title" className="heading-lg text-white">
              {story.title}
            </h2>

            {story.subtitle && (
              <p className="font-serif italic text-lg md:text-xl text-accent-300">
                {story.subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close reader modal"
            className="p-2 rounded-lg text-ivory-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Audio Narrator Bar & Metadata Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-dark-card border border-white/10">
          <div className="flex items-center gap-3 text-ivory-300 text-sm">
            <User className="w-4 h-4 text-accent-400" aria-hidden="true" />
            <span>Attribution: <strong className="text-ivory-100 font-semibold">{story.thinkerOrGriot}</strong></span>
          </div>

          {speechSupported && (
            <button
              onClick={toggleNarration}
              type="button"
              aria-pressed={speaking}
              className="btn btn-outline btn-sm gap-2"
            >
              {speaking ? <Square className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
              <span>{speaking ? 'Stop reading aloud' : 'Read aloud'}</span>
            </button>
          )}
        </div>

        {/* Featured Proverb / Quote Banner */}
        <div className="p-6 rounded-xl bg-dark-card border-l-2 border-accent-400/70 space-y-2">
          <Quote className="w-5 h-5 text-accent-400" aria-hidden="true" />
          <blockquote className="font-serif text-xl md:text-2xl italic text-ivory-100 leading-relaxed">
            "{story.quote}"
          </blockquote>
        </div>

        {/* Main Narrative Content */}
        <div className="space-y-5 text-ivory-300 text-base md:text-lg leading-relaxed">
          {story.fullContent.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Historical Context & Scholar Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-white/10">
          <div className="p-5 rounded-2xl bg-dark-card border border-white/10 space-y-2">
            <h4 className="eyebrow">
              Historical context
            </h4>
            <p className="text-sm text-ivory-300 leading-relaxed">
              {story.historicalContext}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-card border border-white/10 space-y-2">
            <h4 className="eyebrow">
              Scholarly analysis
            </h4>
            <p className="text-sm text-ivory-300 leading-relaxed">
              {story.scholarNotes}
            </p>
          </div>
        </div>

        {/* Primary Archival Sources */}
        <div className="space-y-3 pt-2">
          <h4 className="font-serif font-bold text-xl text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-400" aria-hidden="true" />
            <span>Primary sources & references</span>
          </h4>
          <div className="space-y-1.5 text-sm text-ivory-400">
            {story.primarySources.map((source, idx) => (
              <div key={idx} className="px-3 py-2 rounded-lg bg-dark-card border border-white/5">
                • {source}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <span className="inline-flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              Share
            </span>
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Close reader
          </Button>
        </div>
      </div>
    </div>
  )
}
