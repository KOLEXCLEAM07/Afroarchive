import React, { useState } from 'react'
import { ShieldCheck, BookOpen, Globe, Award, Layers, Users, ArrowRight, Sparkles, FileText } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ContributorModal } from './ContributorModal'

export const AboutSection: React.FC = () => {
  const [contributorModalOpen, setContributorModalOpen] = useState(false)

  const pillars = [
    {
      title: 'Oral & Written Parity',
      icon: BookOpen,
      desc: 'Treating oral epics, Griot lineages, and Saharan manuscripts as equal primary sources of civilizational truth.',
    },
    {
      title: 'Primary Source Rigor',
      icon: ShieldCheck,
      desc: 'Every catalog entry is authenticated with verified archival citations, radiocarbon dates, and peer references.',
    },
    {
      title: 'Decolonized Taxonomy',
      icon: Layers,
      desc: 'Structuring African knowledge around indigenous cosmological, mathematical, and philosophical categories.',
    },
    {
      title: 'Global Open Access',
      icon: Globe,
      desc: 'Ensuring universal free access for scholars, students, and descendants across the globe without paywalls.',
    },
  ]

  const verificationTiers = [
    { step: '01', title: 'Primary Source Audit', detail: 'Physical manuscript or archaeological record verification.' },
    { step: '02', title: 'Lineage Authentication', detail: 'Oral tradition cross-referencing with recognized elders & Jelis.' },
    { step: '03', title: 'Carbon & Geographic Mapping', detail: 'Radiocarbon dating & GIS cartographic coordinate mapping.' },
    { step: '04', title: 'Open Access Indexing', detail: 'Permanent open-access digital archival publishing.' },
  ]

  return (
    <section
      id="about"
      aria-label="About AfroArchive and Mission"
      className="section bg-white dark:bg-dark-surface border-t border-sand-200 dark:border-dark-border text-gray-900 dark:text-ivory-100 transition-colors overflow-hidden"
    >
      <div className="container-app space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-sand-200 dark:border-dark-border pb-8">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center space-x-3">
              <span className="badge badge-primary">DIGITAL MUSEUM MANIFESTO</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Preserve · Discover · Empower
              </span>
            </div>

            <h2 className="heading-xl text-gray-900 dark:text-white tracking-tight">
              Africa’s Knowledge, Preserved for the Future
            </h2>

            <p className="font-sans text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-light">
              AfroArchive was built to serve as an interactive digital museum and open-access archive for African history, philosophy, science, architecture, literature, and indigenous wisdom.
            </p>
          </div>

          <div className="badge badge-primary">
            GLOBAL OPEN ACCESS
          </div>
        </div>

        {/* 4 Foundational Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => {
            const IconComp = p.icon
            return (
              <div key={p.title} className="card p-6 bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border space-y-3 hover:border-primary-400/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-500/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">{p.title}</h3>
                <p className="font-sans text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{p.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Peer-Verification Methodology Panel */}
        <div className="card p-8 md:p-12 bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-sand-200 dark:border-dark-border pb-6 gap-4">
            <div className="space-y-1">
              <span className="badge badge-primary mb-1">
                CURATORIAL STANDARD
              </span>
              <h3 className="heading-lg text-gray-900 dark:text-white">
                4-Tier Peer-Verification Protocol
              </h3>
            </div>
            
            <button
              onClick={() => setContributorModalOpen(true)}
              className="btn btn-primary btn-md"
            >
              Submit Heritage Proposal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {verificationTiers.map((tier) => (
              <div key={tier.step} className="p-5 rounded-xl bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border space-y-2">
                <span className="text-xs font-mono font-bold text-primary-600 dark:text-accent-400">{tier.step}.</span>
                <h4 className="font-serif text-sm font-semibold text-gray-900 dark:text-white">{tier.title}</h4>
                <p className="font-sans text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{tier.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ContributorModal
        isOpen={contributorModalOpen}
        onClose={() => setContributorModalOpen(false)}
      />
    </section>
  )
}
