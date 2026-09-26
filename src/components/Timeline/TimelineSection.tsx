import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Calendar, ArrowRight, Shield, Award, CheckCircle2, ChevronRight } from 'lucide-react'
import { TIMELINE_ERAS, ARTIFACTS_DATA } from '../../data/archiveData'
import { ArtifactItem } from '../../types/archiveTypes'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export interface TimelineSectionProps {
  onInspectArtifact: (artifact: ArtifactItem) => void
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ onInspectArtifact }) => {
  const [activeEraId, setActiveEraId] = useState(TIMELINE_ERAS[0].id)
  const shouldReduceMotion = useReducedMotion()

  const currentEra = TIMELINE_ERAS.find((e) => e.id === activeEraId) || TIMELINE_ERAS[0]

  // Find featured artifact for current era
  const featuredArtifact = ARTIFACTS_DATA.find((a) => a.id === currentEra.featuredArtifactId) || ARTIFACTS_DATA[0]

  return (
    <section
      id="timeline"
      aria-label="Chronological Civilizations Timeline"
      className="relative w-full bg-charcoal-950 text-ivory-100 py-24 border-t border-ivory-100/10 overflow-hidden"
    >
      {/* Background Vignette Atmosphere */}
      <div 
        className="absolute inset-0 bg-museum-vignette pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ivory-100/10 pb-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-3">
              <Badge variant="bronze" size="sm">
                EXHIBITION GALLERY 03
              </Badge>
              <span className="font-mono text-2xs uppercase tracking-widest text-ivory-400">
                CHRONOLOGICAL EXHIBITION
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl md:text-5xl text-ivory-100 tracking-tight">
              CIVILIZATIONS TIMELINE
            </h2>

            <p className="font-sans text-sm md:text-base text-ivory-300 font-light leading-relaxed">
              Trace the major historical epochs, empires, and scientific milestones across African antiquity and medieval civilizations.
            </p>
          </div>

          <div className="font-mono text-2xs text-bronze-400 uppercase tracking-widest">
            2500 BCE — 1900 CE ARCHIVAL SEQUENCE
          </div>
        </div>

        {/* Interactive Horizontal Scrubber / Era Selector */}
        <div className="relative border-y border-ivory-100/10 py-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-4 md:space-x-8 min-w-max">
            {TIMELINE_ERAS.map((era, idx) => {
              const isActive = era.id === activeEraId
              return (
                <button
                  key={era.id}
                  onClick={() => setActiveEraId(era.id)}
                  type="button"
                  aria-pressed={isActive}
                  className={`group relative flex flex-col items-start p-4 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-charcoal-800 border border-bronze-400/50 shadow-bronze-glow'
                      : 'bg-charcoal-900/60 border border-ivory-100/5 hover:border-ivory-100/20 hover:bg-charcoal-850'
                  }`}
                >
                  <span className="font-mono text-2xs text-bronze-400 tracking-widest uppercase mb-1">
                    ERA 0{idx + 1} · {era.period}
                  </span>
                  <span
                    className={`font-display font-semibold text-base md:text-lg transition-colors ${
                      isActive ? 'text-ivory-100' : 'text-ivory-400 group-hover:text-ivory-200'
                    }`}
                  >
                    {era.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Era Spotlight & Featured Artifact Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Era Overview Details */}
          <div className="lg:col-span-7 bg-charcoal-850 p-6 md:p-10 rounded-lg border border-ivory-100/10 flex flex-col justify-between space-y-6 shadow-museum">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Badge variant="bronze" size="sm">
                  {currentEra.period}
                </Badge>
                <span className="font-mono text-2xs uppercase text-ivory-400 tracking-wider">
                  {currentEra.region}
                </span>
              </div>

              <h3 className="font-display font-semibold text-2xl md:text-3xl text-ivory-100">
                {currentEra.title}
              </h3>

              <p className="font-sans text-sm md:text-base text-ivory-300 font-light leading-relaxed">
                {currentEra.summary}
              </p>
            </div>

            {/* Achievements Checklist */}
            <div className="space-y-3 pt-4 border-t border-ivory-100/10">
              <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
                KEY HISTORICAL ACHIEVEMENTS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentEra.achievements.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-2.5 text-xs text-ivory-200">
                    <CheckCircle2 className="w-4 h-4 text-bronze-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Era Artifact Spotlight */}
          <div className="lg:col-span-5 bg-charcoal-850 p-6 md:p-8 rounded-lg border border-ivory-100/10 flex flex-col justify-between space-y-6 shadow-artifact">
            <div className="space-y-3">
              <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
                ERA FEATURED ARTIFACT
              </span>

              <h4 className="font-display font-semibold text-xl text-ivory-100">
                {featuredArtifact.title}
              </h4>

              <p className="font-sans text-xs text-ivory-300 font-light line-clamp-3">
                {featuredArtifact.summary}
              </p>
            </div>

            <div className="p-4 rounded bg-charcoal-900 border border-ivory-100/10 space-y-2">
              <div className="flex justify-between font-mono text-[10px] uppercase text-ivory-400">
                <span>CATALOG</span>
                <span className="text-bronze-400">{featuredArtifact.catalogNumber}</span>
              </div>
              <div className="flex justify-between font-mono text-[10px] uppercase text-ivory-400">
                <span>LOCATION</span>
                <span className="text-ivory-200">{featuredArtifact.originLocation}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => onInspectArtifact(featuredArtifact)}
              className="w-full"
            >
              INSPECT ERA ARTIFACT
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
