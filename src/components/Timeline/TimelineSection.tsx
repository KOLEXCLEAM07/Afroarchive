import React, { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { TIMELINE_ERAS, ARTIFACTS_DATA } from '../../data/archiveData'
import { ArtifactItem } from '../../types/archiveTypes'

export interface TimelineSectionProps {
  onInspectArtifact: (artifact: ArtifactItem) => void
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ onInspectArtifact }) => {
  const [activeEraId, setActiveEraId] = useState(TIMELINE_ERAS[0].id)

  const currentEra = TIMELINE_ERAS.find((e) => e.id === activeEraId) || TIMELINE_ERAS[0]

  // Find featured artifact for current era
  const featuredArtifact = ARTIFACTS_DATA.find((a) => a.id === currentEra.featuredArtifactId) || ARTIFACTS_DATA[0]

  return (
    <section
      id="timeline"
      aria-label="Chronological Civilizations Timeline"
      className="py-12 md:py-16 bg-dark-surface border-t border-white/10 text-ivory-100 overflow-hidden"
    >
      <div className="container-app space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Chronological exhibition</span>
              <span className="text-xs text-ivory-400">
                2500 BCE — 1900 CE
              </span>
            </div>

            <h2 className="heading-xl text-white">
              Civilizations timeline
            </h2>

            <p className="text-sm md:text-base text-ivory-300 leading-relaxed">
              Trace the major historical epochs, empires, and scientific milestones across African antiquity and medieval civilizations.
            </p>
          </div>

          <span className="badge badge-gray self-start md:self-auto">
            Archival sequence
          </span>
        </div>

        {/* Interactive Horizontal Scrubber / Era Selector */}
        <div className="relative overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
          <div className="flex items-stretch gap-3 md:gap-4 min-w-max">
            {TIMELINE_ERAS.map((era, idx) => {
              const isActive = era.id === activeEraId
              return (
                <button
                  key={era.id}
                  onClick={() => setActiveEraId(era.id)}
                  type="button"
                  aria-pressed={isActive}
                  className={`group relative flex flex-col items-start px-4 py-3.5 rounded-2xl border text-left transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-accent-400/10 border-accent-400/50'
                      : 'bg-dark-card border-white/10 hover:border-white/25'
                  }`}
                >
                  <span className="text-xs text-accent-300 mb-1">
                    Era 0{idx + 1} · {era.period}
                  </span>
                  <span
                    className={`font-serif font-bold text-base md:text-lg transition-colors ${
                      isActive ? 'text-white' : 'text-ivory-300 group-hover:text-white'
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
          <div className="lg:col-span-7 card rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="badge badge-accent">
                  {currentEra.period}
                </span>
                <span className="text-xs text-ivory-400">
                  {currentEra.region}
                </span>
              </div>

              <h3 className="heading-lg text-white">
                {currentEra.title}
              </h3>

              <p className="text-sm md:text-base text-ivory-300 leading-relaxed">
                {currentEra.summary}
              </p>
            </div>

            {/* Achievements Checklist */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <span className="eyebrow">
                Key historical achievements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentEra.achievements.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-ivory-300">
                    <CheckCircle2 className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Era Artifact Spotlight */}
          <div className="lg:col-span-5 card rounded-2xl overflow-hidden flex flex-col justify-between space-y-6">
            {featuredArtifact.imageSrc ? (
              <figure className="relative aspect-[16/9] w-full overflow-hidden bg-dark-card border-b border-white/10">
                <img
                  src={featuredArtifact.imageSrc}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 border border-white/10 px-2.5 py-0.5 font-mono text-[11px] text-ivory-100 backdrop-blur-md max-w-[70%] truncate">
                  {featuredArtifact.catalogNumber}
                </span>
              </figure>
            ) : null}
            <div className="p-6 md:p-8 space-y-6 flex flex-col justify-between flex-1">
            <div className="space-y-3">
              <span className="eyebrow">
                Featured heritage
              </span>

              <h4 className="font-serif font-bold text-2xl text-white">
                {featuredArtifact.title}
              </h4>

              <p className="text-sm text-ivory-400 leading-relaxed line-clamp-3">
                {featuredArtifact.summary}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-dark-surface border border-white/10 space-y-2">
              <div className="flex justify-between gap-3 text-xs text-ivory-400">
                <span>Catalogue</span>
                <span className="font-mono text-accent-300">{featuredArtifact.catalogNumber}</span>
              </div>
              <div className="flex justify-between gap-3 text-xs text-ivory-400">
                <span>Location</span>
                <span className="text-ivory-200">{featuredArtifact.originLocation}</span>
              </div>
            </div>

            <button
              onClick={() => onInspectArtifact(featuredArtifact)}
              className="btn btn-primary btn-md w-full"
            >
              Inspect era artifact
            </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
