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
      className="section bg-white dark:bg-dark-surface border-t border-sand-200 dark:border-dark-border text-gray-900 dark:text-ivory-100 transition-colors overflow-hidden"
    >
      <div className="container-app space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-sand-200 dark:border-dark-border pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="badge badge-primary">CHRONOLOGICAL EXHIBITION</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                2500 BCE — 1900 CE
              </span>
            </div>

            <h2 className="heading-xl text-gray-900 dark:text-white tracking-tight">
              Civilizations Timeline
            </h2>

            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
              Trace the major historical epochs, empires, and scientific milestones across African antiquity and medieval civilizations.
            </p>
          </div>

          <div className="badge badge-primary">
            ARCHIVAL SEQUENCE
          </div>
        </div>

        {/* Interactive Horizontal Scrubber / Era Selector */}
        <div className="relative border-y border-sand-200 dark:border-dark-border py-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-4 md:space-x-6 min-w-max">
            {TIMELINE_ERAS.map((era, idx) => {
              const isActive = era.id === activeEraId
              return (
                <button
                  key={era.id}
                  onClick={() => setActiveEraId(era.id)}
                  type="button"
                  aria-pressed={isActive}
                  className={`group relative flex flex-col items-start p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'card bg-primary-50 dark:bg-primary-950/40 border-2 border-primary-500 dark:border-accent-400 shadow-md'
                      : 'card bg-white dark:bg-dark-card border border-sand-200 dark:border-dark-border hover:border-primary-400/40'
                  }`}
                >
                  <span className="text-xs font-mono text-primary-600 dark:text-accent-400 uppercase tracking-wider mb-1">
                    Era 0{idx + 1} · {era.period}
                  </span>
                  <span
                    className={`font-serif font-bold text-base md:text-lg transition-colors ${
                      isActive ? 'text-primary-700 dark:text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-primary-600'
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
          <div className="lg:col-span-7 card p-6 md:p-8 bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="badge badge-primary">
                  {currentEra.period}
                </span>
                <span className="text-xs font-mono uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                  {currentEra.region}
                </span>
              </div>

              <h3 className="heading-lg text-gray-900 dark:text-white">
                {currentEra.title}
              </h3>

              <p className="font-sans text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {currentEra.summary}
              </p>
            </div>

            {/* Achievements Checklist */}
            <div className="space-y-3 pt-4 border-t border-sand-200 dark:border-dark-border">
              <span className="text-xs font-semibold text-primary-600 dark:text-accent-400 uppercase tracking-wider">
                Key Historical Achievements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentEra.achievements.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Era Artifact Spotlight */}
          <div className="lg:col-span-5 card p-6 md:p-8 bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="badge badge-primary">
                Featured Heritage
              </span>

              <h4 className="font-serif font-bold text-xl text-gray-900 dark:text-white">
                {featuredArtifact.title}
              </h4>

              <p className="font-sans text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                {featuredArtifact.summary}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border space-y-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
                <span>CATALOG</span>
                <span className="text-primary-600 dark:text-accent-400 font-semibold">{featuredArtifact.catalogNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
                <span>LOCATION</span>
                <span className="text-gray-800 dark:text-gray-200">{featuredArtifact.originLocation}</span>
              </div>
            </div>

            <button
              onClick={() => onInspectArtifact(featuredArtifact)}
              className="btn btn-primary btn-md w-full"
            >
              Inspect Era Artifact
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
